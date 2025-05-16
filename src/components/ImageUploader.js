import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
    setUploadStatus('');
    setError('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload.');
      return;
    }
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });
    try {
      setUploadStatus('Uploading...');
      setError('');
      const response = await axios.post('/api/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        setUploadStatus('Images uploaded successfully!');
        setSelectedFiles([]);
      } else {
        setError(response.data.message || 'Upload failed.');
      }
    } catch (err) {
      setError('Error uploading images. Please try again.');
      console.error('Image upload error:', err);
    }
  };

  return (
    <div className="image-uploader">
      <h2>Bulk Image Upload</h2>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="file-input"
      />
      {selectedFiles.length > 0 && (
        <div className="file-list">
          <h4>Selected Images:</h4>
          <ul>
            {selectedFiles.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={handleUpload} className="upload-button">
        Upload Images
      </button>
      {uploadStatus && <p className="status">{uploadStatus}</p>}
      {error && <p className="error">{error}</p>}
      <style jsx>{`
        .image-uploader {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        .file-input {
          margin: 10px 0;
        }
        .upload-button {
          padding: 10px 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .upload-button:hover {
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
        .file-list {
          margin: 10px 0;
        }
        .file-list ul {
          padding-left: 20px;
        }
      `}</style>
    </div>
  );
};

export default ImageUploader; 