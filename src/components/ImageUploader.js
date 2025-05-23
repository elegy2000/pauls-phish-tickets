import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
    const maxBatchSize = 4 * 1024 * 1024; // 4MB to stay under Vercel's 4.5MB limit

    for (const file of files) {
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

    return batches;
  };

  const uploadBatch = async (batch) => {
    const formData = new FormData();
    batch.forEach((file) => {
      formData.append('images', file);
    });

    const response = await axios.post('/api/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload.');
      return;
    }

    const batches = createBatches(selectedFiles);
    const totalBatches = batches.length;
    
    console.log(`Uploading ${selectedFiles.length} files in ${totalBatches} batches`);

    try {
      setIsUploading(true);
      setError('');
      setProgress({ current: 0, total: totalBatches });
      
      const allUploaded = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setUploadStatus(`Uploading batch ${i + 1} of ${totalBatches} (${batch.length} images)...`);
        
        try {
          const result = await uploadBatch(batch);
          if (result.success) {
            allUploaded.push(...result.files);
            setProgress({ current: i + 1, total: totalBatches });
          } else {
            throw new Error(result.message || 'Batch upload failed');
          }
        } catch (batchError) {
          console.error(`Batch ${i + 1} failed:`, batchError);
          setError(`Batch ${i + 1} failed: ${batchError.message}. ${allUploaded.length} images uploaded successfully before this error.`);
          setIsUploading(false);
          return;
        }
      }

      setUploadStatus(`All ${allUploaded.length} images uploaded successfully!`);
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

  return (
    <div className="image-uploader">
      <h2>Bulk Image Upload</h2>
      <div className="upload-info">
        <p><strong>📋 Instructions:</strong></p>
        <ul>
          <li>Select multiple images (JPG, PNG, etc.)</li>
          <li>Images will be uploaded in batches to avoid size limits</li>
          <li>Maximum 10MB per image, recommended under 1MB each</li>
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
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">({Math.round(file.size / 1024)}KB)</span>
              </div>
            ))}
          </div>
          <p className="batch-info">
            Will be uploaded in {createBatches(selectedFiles).length} batch(es)
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
      
      <style jsx>{`
        .image-uploader {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .upload-info {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .upload-info ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }
        .file-input {
          margin: 10px 0;
          padding: 10px;
          border: 2px dashed #ccc;
          border-radius: 4px;
          width: 100%;
        }
        .upload-button {
          padding: 12px 24px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 15px;
          margin-right: 10px;
        }
        .upload-button:hover:not(:disabled) {
          background-color: #0051a8;
        }
        .upload-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .reset-button {
          padding: 12px 24px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 15px;
        }
        .reset-button:hover:not(:disabled) {
          background-color: #c82333;
        }
        .reset-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .file-list {
          margin: 15px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
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
          border-bottom: 1px solid #eee;
        }
        .file-name {
          font-weight: 500;
        }
        .file-size {
          color: #666;
          font-size: 12px;
        }
        .batch-info {
          color: #0070f3;
          font-weight: 500;
          margin-top: 10px;
        }
        .progress-section {
          margin: 15px 0;
        }
        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background-color: #0070f3;
          transition: width 0.3s ease;
        }
        .progress-text {
          text-align: center;
          margin-top: 5px;
          font-weight: 500;
        }
        .status {
          color: #28a745;
          margin-top: 10px;
          font-weight: 500;
        }
        .error {
          color: #dc3545;
          margin-top: 10px;
          font-weight: 500;
          white-space: pre-line;
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;