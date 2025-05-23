import React, { useState } from 'react';

const CsvHandler = () => {
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setError('');
    setUploadStatus('');

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      event.target.value = ''; // Clear the file input
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit');
      event.target.value = ''; // Clear the file input
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      setIsUploading(true);
      setUploadStatus('Uploading...');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus('File uploaded successfully!');
        // Clear the file input
        event.target.value = '';
      } else {
        let errorMessage = data.message || 'Error uploading file.';
        
        // Add error details if available
        if (data.error) {
          errorMessage += `\nError: ${data.error}`;
        }
        
        // Add Supabase specific error details
        if (data.details) {
          if (data.details.code) {
            errorMessage += `\nCode: ${data.details.code}`;
          }
          if (data.details.hint) {
            errorMessage += `\nHint: ${data.details.hint}`;
          }
          if (data.details.details) {
            errorMessage += `\nDetails: ${data.details.details}`;
          }
          if (data.details.batchIndex !== undefined) {
            const batchNumber = Math.floor(data.details.batchIndex / (data.details.batchSize || 50)) + 1;
            errorMessage += `\nFailed at batch: ${batchNumber}`;
            if (data.details.sampleRecord) {
              errorMessage += `\nSample record from failed batch: ${JSON.stringify(data.details.sampleRecord, null, 2)}`;
            }
          }
        }
        
        setError(errorMessage);
        console.error('Upload error details:', data);
        event.target.value = ''; // Clear the file input on error
      }
    } catch (err) {
      setError(`Error uploading file: ${err.message}`);
      console.error('Upload error:', err);
      event.target.value = ''; // Clear the file input on error
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setError('');
      const response = await fetch('/api/download', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'phish_tours.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (err) {
      setError('Error downloading file. Please try again.');
      console.error('Download error:', err);
    }
  };

  return (
    <div className="csv-handler">
      <h2>CSV File Management</h2>
      
      <div className="upload-section">
        <h3>Upload CSV</h3>
        <div className="csv-warning" style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          color: '#856404',
          borderRadius: '4px',
          padding: '10px 15px',
          marginBottom: '15px',
          fontWeight: 'bold'
        }}>
          ⚠️ Uploading a CSV will <u>REPLACE ALL</u> existing tickets in the database.<br />
          Please <span style={{textDecoration: 'underline'}}>download a backup CSV first</span> if you want to keep the current data.
        </div>
        <div className="instructions">
          <h4>Required CSV Format:</h4>
          <p>Your CSV file must include the following columns:</p>
          <ul>
            <li><strong>year</strong> - Show year (e.g., 2023)</li>
            <li><strong>date</strong> - Show date in YYYY-MM-DD format</li>
            <li><strong>venue</strong> - Venue name</li>
            <li><strong>city_state</strong> - City and state (e.g., "New York, NY")</li>
          </ul>
          <p>Optional columns:</p>
          <ul>
            <li><strong>imageurl</strong> - URL to ticket image</li>
            <li><strong>net_link</strong> - Link to show information</li>
          </ul>
          <p className="note">Note: Maximum file size is 5MB</p>
        </div>
        
        <div className="upload-controls">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="file-input"
          />
          {isUploading && (
            <div className="upload-progress">
              <div className="spinner"></div>
              <span>Uploading...</span>
            </div>
          )}
        </div>
        
        {uploadStatus && <p className="status success">{uploadStatus}</p>}
        {error && (
          <div className="error-message">
            {error.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>

      <div className="download-section">
        <h3>Download Current Data</h3>
        <button onClick={handleDownload} className="download-button">
          Export to CSV
        </button>
      </div>

      <style jsx>{`
        .csv-handler {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        h2 {
          color: #ffffff;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .upload-section, .download-section {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          background: #1a1a1a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        h3 {
          color: #ffffff;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .instructions {
          margin: 1rem 0;
          padding: 1rem;
          background-color: #2a2a2a;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }

        .instructions h4 {
          color: #3b82f6;
          margin: 0 0 0.5rem 0;
        }

        .instructions ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          color: #cccccc;
        }

        .instructions li {
          margin: 0.25rem 0;
          color: #cccccc;
        }

        .instructions p {
          color: #cccccc;
        }

        .note {
          font-style: italic;
          color: #888888;
          margin-top: 0.5rem;
        }

        .upload-controls {
          margin: 1rem 0;
        }

        .file-input {
          width: 100%;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border: 1px solid #404040;
          border-radius: 4px;
          background: #2a2a2a;
          color: #ffffff;
        }

        .file-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: #1a1a1a;
        }

        .upload-progress {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
          color: #3b82f6;
        }

        .spinner {
          width: 20px;
          height: 20px;
          margin-right: 0.5rem;
          border: 2px solid #404040;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .status {
          margin: 1rem 0;
          padding: 0.5rem;
          border-radius: 4px;
        }

        .status.success {
          background-color: #1a2e1a;
          color: #10b981;
          border: 1px solid #10b981;
        }

        .error-message {
          margin: 1rem 0;
          padding: 1rem;
          background-color: #2a1a1a;
          border: 1px solid #ef4444;
          border-radius: 4px;
          color: #ef4444;
        }

        .error-message p {
          margin: 0.25rem 0;
          color: #ef4444;
        }

        .download-button {
          padding: 0.75rem 1.5rem;
          background-color: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .download-button:hover {
          background-color: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
        }

        .download-button:active {
          background-color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default CsvHandler; 