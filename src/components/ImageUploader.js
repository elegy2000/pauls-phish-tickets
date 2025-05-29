import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Year Images Upload Manager state
  const [yearFiles, setYearFiles] = useState([]);
  const [yearUploadStatus, setYearUploadStatus] = useState('');
  const [yearError, setYearError] = useState('');
  const [isUploadingYears, setIsUploadingYears] = useState(false);
  const [existingYearImages, setExistingYearImages] = useState([]);

  // Load existing year images when component mounts
  useEffect(() => {
    loadExistingYearImages();
  }, []);

  const loadExistingYearImages = async () => {
    try {
      const response = await axios.get('/api/list-year-images');
      if (response.data.success) {
        setExistingYearImages(response.data.images || []);
      }
    } catch (err) {
      console.error('Error loading existing year images:', err);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
    setUploadStatus('');
    setError('');
    setProgress({ current: 0, total: 0 });
  };

  // Calculate batch size based on file sizes to stay under 4MB
  const createBatches = (files) => {
    const batches = [];
    let currentBatch = [];
    let currentBatchSize = 0;
    const maxBatchSize = 3.5 * 1024 * 1024; // 3.5MB to stay well under Vercel's 4.5MB limit
    const maxFileSize = 4 * 1024 * 1024; // 4MB per individual file
    const oversizedFiles = [];

    for (const file of files) {
      // Check if individual file is too large
      if (file.size > maxFileSize) {
        oversizedFiles.push({
          name: file.name,
          size: Math.round(file.size / (1024 * 1024) * 10) / 10 // Size in MB, rounded to 1 decimal
        });
        continue; // Skip this file
      }

      // If adding this file would exceed the limit, start a new batch
      if (currentBatchSize + file.size > maxBatchSize && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [file];
        currentBatchSize = file.size;
      } else {
        currentBatch.push(file);
        currentBatchSize += file.size;
      }
    }

    // Add the last batch if it has files
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return { batches, oversizedFiles };
  };

  const uploadBatch = async (batch, batchNumber, totalBatches) => {
    const formData = new FormData();
    batch.forEach((file) => {
      formData.append('images', file);
    });

    console.log(`Uploading batch ${batchNumber}/${totalBatches} with ${batch.length} files`);

    try {
      const response = await axios.post('/api/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout per batch
      });

      return response.data;
    } catch (error) {
      console.error(`Batch ${batchNumber} upload error:`, error);
      // Provide more detailed error information
      if (error.response) {
        throw new Error(`Server error (${error.response.status}): ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('Network error - request timed out or connection lost');
      } else {
        throw new Error(`Upload error: ${error.message}`);
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload.');
      return;
    }

    const { batches, oversizedFiles } = createBatches(selectedFiles);
    const totalBatches = batches.length;
    
    // Show warning about oversized files
    if (oversizedFiles.length > 0) {
      const oversizedList = oversizedFiles.map(f => `${f.name} (${f.size}MB)`).join('\n');
      const proceed = window.confirm(
        `⚠️ WARNING: ${oversizedFiles.length} file(s) are too large (>4MB) and will be SKIPPED:\n\n${oversizedList}\n\nVercel has a 4.5MB request limit. Please resize these images to under 4MB.\n\nDo you want to continue uploading the remaining ${selectedFiles.length - oversizedFiles.length} file(s)?`
      );
      
      if (!proceed) {
        return;
      }
    }

    if (batches.length === 0) {
      setError('All selected files are too large (>4MB). Please resize your images and try again.');
      return;
    }
    
    console.log(`Uploading ${selectedFiles.length - oversizedFiles.length} files in ${totalBatches} batches (${oversizedFiles.length} files skipped due to size)`);

    try {
      setIsUploading(true);
      setError('');
      setProgress({ current: 0, total: totalBatches });
      
      const allUploaded = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setUploadStatus(`Uploading batch ${i + 1} of ${totalBatches} (${batch.length} images)...`);
        
        try {
          const result = await uploadBatch(batch, i + 1, totalBatches);
          if (result.success) {
            allUploaded.push(...result.files);
            setProgress({ current: i + 1, total: totalBatches });
            
            // Handle partial successes
            if (result.errors && result.errors.length > 0) {
              console.warn(`Batch ${i + 1} had ${result.errors.length} failures:`, result.errors);
              setUploadStatus(`Batch ${i + 1} completed with ${result.uploadedCount}/${result.totalCount} files uploaded. Continuing...`);
            }
          } else {
            // Handle complete batch failure
            const errorMessage = result.message || 'Batch upload failed';
            const detailedErrors = result.errors ? `: ${result.errors.join(', ')}` : '';
            throw new Error(errorMessage + detailedErrors);
          }
        } catch (batchError) {
          console.error(`Batch ${i + 1} failed:`, batchError);
          
          // For network errors, suggest smaller batches
          if (batchError.message.includes('Network error') || batchError.message.includes('timed out')) {
            setError(`❌ Batch ${i + 1} failed due to network timeout.\n\n💡 Try uploading fewer images at once (5-10 at a time) or check your internet connection.\n\nSuccessfully uploaded ${allUploaded.length} images before this error.`);
          } else {
            setError(`❌ Batch ${i + 1} failed: ${batchError.message}\n\nSuccessfully uploaded ${allUploaded.length} images before this error.`);
          }
          setIsUploading(false);
          return;
        }
      }

      let successMessage = `Successfully uploaded ${allUploaded.length} images!`;
      if (oversizedFiles.length > 0) {
        successMessage += ` (${oversizedFiles.length} files skipped due to size limits)`;
      }
      
      setUploadStatus(successMessage);
      setSelectedFiles([]);
      setProgress({ current: 0, total: 0 });
      
    } catch (err) {
      setError('Error uploading images. Please try again.');
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will DELETE ALL images from the server.\n\n' +
      'This action cannot be undone. Are you sure you want to proceed?'
    );
    
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      '🚨 FINAL CONFIRMATION\n\n' +
      'This will permanently delete ALL ticket images from the server.\n\n' +
      'Type "DELETE" in the next prompt to confirm.'
    );
    
    if (!doubleConfirmed) return;

    const userInput = window.prompt('Type "DELETE" to confirm (case sensitive):');
    if (userInput !== 'DELETE') {
      setError('Reset cancelled - incorrect confirmation text.');
      return;
    }

    try {
      setIsResetting(true);
      setError('');
      setUploadStatus('Deleting all images...');
      
      const response = await axios.delete('/api/reset-images');
      
      if (response.data.success) {
        setUploadStatus(`Successfully deleted ${response.data.deletedCount} images from server.`);
      } else {
        throw new Error(response.data.message || 'Reset failed');
      }
    } catch (err) {
      setError(`Error resetting images: ${err.message}`);
      console.error('Image reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Year Images Upload Handlers
  const handleYearFileChange = (event) => {
    const files = Array.from(event.target.files);
    setYearFiles(files);
    setYearUploadStatus('');
    setYearError('');
    
    // Validate that filenames match existing year images
    validateYearFilenames(files);
  };

  const validateYearFilenames = (files) => {
    const invalidFiles = [];
    const validFiles = [];
    
    files.forEach(file => {
      const isValid = existingYearImages.includes(file.name);
      if (isValid) {
        validFiles.push(file.name);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setYearError(
        `❌ Invalid filenames detected:\n${invalidFiles.join('\n')}\n\n` +
        `✅ Valid filenames that can be replaced:\n${existingYearImages.join('\n')}\n\n` +
        `Please rename your files to match existing year image names exactly.`
      );
    } else if (validFiles.length > 0) {
      setYearUploadStatus(`✅ ${validFiles.length} valid filename(s) detected: ${validFiles.join(', ')}`);
    }
  };

  const handleYearUpload = async () => {
    if (yearFiles.length === 0) {
      setYearError('Please select at least one year image to upload.');
      return;
    }

    // Final validation
    const invalidFiles = yearFiles.filter(file => !existingYearImages.includes(file.name));
    if (invalidFiles.length > 0) {
      setYearError(`Cannot upload files with invalid names: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    try {
      setIsUploadingYears(true);
      setYearError('');
      setYearUploadStatus('Uploading year images...');

      const formData = new FormData();
      yearFiles.forEach((file) => {
        formData.append('yearImages', file);
      });

      const response = await axios.post('/api/upload-year-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setYearUploadStatus(`✅ Successfully replaced ${response.data.replacedCount} year image(s)!`);
        setYearFiles([]);
        // Refresh the existing images list
        await loadExistingYearImages();
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      setYearError(`Error uploading year images: ${err.response?.data?.message || err.message}`);
      console.error('Year image upload error:', err);
    } finally {
      setIsUploadingYears(false);
    }
  };

  return (
    <div className="image-uploader">
      <h2>Bulk Image Upload</h2>
      <div className="upload-info">
        <p><strong>📋 Instructions:</strong></p>
        <ul>
          <li>Select multiple images (JPG, PNG, etc.)</li>
          <li>Images will be uploaded in batches to avoid size limits</li>
          <li><strong>Maximum 4MB per image</strong> (Vercel hosting limitation)</li>
          <li>Recommended: Under 1MB each for faster uploads</li>
        </ul>
      </div>
      
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="file-input"
        disabled={isUploading}
      />
      
      {selectedFiles.length > 0 && (
        <div className="file-list">
          <h4>Selected Images ({selectedFiles.length}):</h4>
          <div className="file-grid">
            {selectedFiles.map((file, idx) => {
              const isOversized = file.size > 4 * 1024 * 1024; // 4MB limit
              const fileSizeKB = Math.round(file.size / 1024);
              const fileSizeMB = Math.round(file.size / (1024 * 1024) * 10) / 10;
              
              return (
                <div key={idx} className={`file-item ${isOversized ? 'oversized' : ''}`}>
                  <span className="file-name">
                    {isOversized && '⚠️ '}{file.name}
                  </span>
                  <span className={`file-size ${isOversized ? 'oversized-text' : ''}`}>
                    ({fileSizeKB < 1024 ? `${fileSizeKB}KB` : `${fileSizeMB}MB`})
                    {isOversized && ' - TOO LARGE'}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="batch-info">
            Will be uploaded in {createBatches(selectedFiles).batches.length} batch(es)
            {(() => {
              const { oversizedFiles } = createBatches(selectedFiles);
              return oversizedFiles.length > 0 ? ` (${oversizedFiles.length} files will be skipped)` : '';
            })()}
          </p>
        </div>
      )}
      
      <button 
        onClick={handleUpload} 
        className="upload-button"
        disabled={isUploading || selectedFiles.length === 0}
      >
        {isUploading ? 'Uploading...' : 'Upload Images'}
      </button>
      
      <button 
        onClick={handleReset} 
        className="reset-button"
        disabled={isResetting || isUploading}
      >
        {isResetting ? 'Deleting...' : 'Reset All Images'}
      </button>
      
      {progress.total > 0 && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">
            Batch {progress.current} of {progress.total} completed
          </p>
        </div>
      )}
      
      {uploadStatus && <p className="status">{uploadStatus}</p>}
      {error && <p className="error">{error}</p>}
      
      {/* Year Images Upload Manager */}
      <div className="year-images-section">
        <h2>Year Images Upload Manager</h2>
        <div className="upload-info">
          <p><strong>🎯 Replace Homepage Year Images:</strong></p>
          <ul>
            <li>Upload new images to replace existing year images on the homepage</li>
            <li><strong>Filename must match exactly</strong> (e.g., "1983.jpg", "1984.jpg")</li>
            <li>Supported formats: JPG, PNG, WebP</li>
            <li>Recommended size: 400x300px or similar aspect ratio</li>
            <li>Maximum 4MB per image</li>
          </ul>
          {existingYearImages.length > 0 && (
            <div className="existing-files">
              <p><strong>📁 Current year images that can be replaced:</strong></p>
              <div className="existing-files-grid">
                {existingYearImages.map((filename, idx) => (
                  <span key={idx} className="existing-file">{filename}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleYearFileChange}
          className="file-input"
          disabled={isUploadingYears}
        />
        
        {yearFiles.length > 0 && (
          <div className="file-list">
            <h4>Selected Year Images ({yearFiles.length}):</h4>
            <div className="file-grid">
              {yearFiles.map((file, idx) => {
                const isValid = existingYearImages.includes(file.name);
                const fileSizeKB = Math.round(file.size / 1024);
                const fileSizeMB = Math.round(file.size / (1024 * 1024) * 10) / 10;
                const isOversized = file.size > 4 * 1024 * 1024;
                
                return (
                  <div key={idx} className={`file-item ${!isValid ? 'invalid' : ''} ${isOversized ? 'oversized' : ''}`}>
                    <span className="file-name">
                      {!isValid && '❌ '}
                      {isOversized && '⚠️ '}
                      {isValid && !isOversized && '✅ '}
                      {file.name}
                    </span>
                    <span className={`file-size ${isOversized ? 'oversized-text' : ''}`}>
                      ({fileSizeKB < 1024 ? `${fileSizeKB}KB` : `${fileSizeMB}MB`})
                      {isOversized && ' - TOO LARGE'}
                      {!isValid && ' - INVALID NAME'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <button 
          onClick={handleYearUpload} 
          className="upload-button"
          disabled={isUploadingYears || yearFiles.length === 0 || yearFiles.some(f => !existingYearImages.includes(f.name) || f.size > 4 * 1024 * 1024)}
        >
          {isUploadingYears ? 'Replacing Images...' : 'Replace Year Images'}
        </button>
        
        {yearUploadStatus && <p className="status">{yearUploadStatus}</p>}
        {yearError && <p className="error">{yearError}</p>}
      </div>
      
      <style jsx>{`
        .image-uploader {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .upload-info {
          background-color: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          color: #cccccc;
        }
        .upload-info ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
          color: #cccccc;
        }
        .upload-info strong {
          color: #ffffff;
        }
        .file-input {
          margin: 10px 0;
          padding: 10px;
          border: 2px dashed #404040;
          border-radius: 4px;
          width: 100%;
          background-color: #1a1a1a;
          color: #ffffff;
        }
        .upload-button {
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          margin-top: 15px;
          margin-right: 10px;
          transition: all 0.2s ease;
        }
        .upload-button:hover:not(:disabled) {
          background-color: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
        }
        .upload-button:disabled {
          background-color: #404040;
          border-color: #404040;
          cursor: not-allowed;
          color: #888888;
        }
        .reset-button {
          padding: 12px 24px;
          background-color: #ef4444;
          color: white;
          border: 1px solid #ef4444;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          margin-top: 15px;
          transition: all 0.2s ease;
        }
        .reset-button:hover:not(:disabled) {
          background-color: #dc2626;
          border-color: #dc2626;
          transform: translateY(-1px);
        }
        .reset-button:disabled {
          background-color: #404040;
          border-color: #404040;
          cursor: not-allowed;
          color: #888888;
        }
        .file-list {
          margin: 15px 0;
          padding: 15px;
          background-color: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 6px;
        }
        .file-list h4 {
          color: #ffffff;
          margin-bottom: 10px;
        }
        .file-grid {
          max-height: 200px;
          overflow-y: auto;
          margin: 10px 0;
        }
        .file-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #404040;
        }
        .file-item.oversized {
          background-color: #2a1a1a;
          padding: 8px;
          margin: 2px 0;
          border-radius: 4px;
          border: 1px solid #ef4444;
        }
        .file-item.invalid {
          background-color: #2a1a1a;
          padding: 8px;
          margin: 2px 0;
          border-radius: 4px;
          border: 1px solid #ef4444;
        }
        .file-name {
          font-weight: 500;
          color: #ffffff;
        }
        .file-size {
          color: #888888;
          font-size: 12px;
        }
        .file-size.oversized-text {
          color: #ef4444;
          font-weight: bold;
        }
        .batch-info {
          color: #3b82f6;
          font-weight: 500;
          margin-top: 10px;
        }
        .progress-section {
          margin: 15px 0;
        }
        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #404040;
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }
        .progress-text {
          text-align: center;
          margin-top: 5px;
          font-weight: 500;
          color: #ffffff;
        }
        .status {
          color: #10b981;
          margin-top: 10px;
          font-weight: 500;
        }
        .error {
          color: #ef4444;
          margin-top: 10px;
          font-weight: 500;
          white-space: pre-line;
        }
        .year-images-section {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #404040;
        }
        .existing-files {
          background-color: #1e3a2e;
          border: 1px solid #10b981;
          border-radius: 6px;
          padding: 15px;
          margin-top: 15px;
        }
        .existing-files p {
          color: #10b981;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .existing-files-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .existing-file {
          background-color: #0f2419;
          border: 1px solid #10b981;
          border-radius: 4px;
          padding: 6px 12px;
          color: #10b981;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;