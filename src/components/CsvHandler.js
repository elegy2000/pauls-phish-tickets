import React, { useState } from 'react';
import axios from 'axios';

const CsvHandler = () => {
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      setUploadStatus('Uploading...');
      setError('');
      
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
            errorMessage += `\nFailed at batch: ${Math.floor(data.details.batchIndex / data.details.batchSize) + 1}`;
          }
        }
        
        setError(errorMessage);
        console.error('Upload error details:', data);
      }
    } catch (err) {
      setError(`Error uploading file: ${err.message}`);
      console.error('Upload error:', err);
    }
  };

  const handleDownload = async () => {
    try {
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
        <p className="instructions">
          Please ensure your CSV file has the following columns:<br/>
          - year<br/>
          - date<br/>
          - venue<br/>
          - city_state<br/>
          - imageUrl (or imageurl or image_url)<br/>
          - net_link (or netLink or netlink)
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="file-input"
        />
        {uploadStatus && <p className="status">{uploadStatus}</p>}
      </div>

      <div className="download-section">
        <h3>Download CSV</h3>
        <button onClick={handleDownload} className="download-button">
          Download Current Data
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <style jsx>{`
        .csv-handler {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }

        .upload-section, .download-section {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .instructions {
          margin: 10px 0;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 0.9em;
        }

        .file-input {
          margin: 10px 0;
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .download-button {
          padding: 10px 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .download-button:hover {
          background-color: #0051a8;
        }

        .status {
          color: #0070f3;
          margin-top: 10px;
          font-weight: bold;
        }

        .error {
          color: #ff0000;
          margin-top: 10px;
          padding: 10px;
          background-color: #fff5f5;
          border: 1px solid #ff0000;
          border-radius: 4px;
          white-space: pre-line;
        }
      `}</style>
    </div>
  );
};

export default CsvHandler; 