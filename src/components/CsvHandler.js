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
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadStatus('File uploaded successfully!');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error uploading file. Please try again.');
      console.error('Upload error:', err);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get('/api/download', {
        responseType: 'blob',
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
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

        .file-input {
          margin: 10px 0;
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
        }

        .error {
          color: #ff0000;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default CsvHandler; 