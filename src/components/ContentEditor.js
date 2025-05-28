import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContentEditor = () => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load existing content when component mounts
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/homepage-content');
      
      if (response.data.success) {
        const contentText = response.data.content || '';
        setContent(contentText);
        setOriginalContent(contentText);
      } else {
        setError('Failed to load content');
      }
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const response = await axios.post('/api/homepage-content', {
        content: content
      });

      if (response.data.success) {
        setMessage('✅ Homepage content updated successfully!');
        setOriginalContent(content);
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update content');
      }
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Error saving content');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    setMessage('');
    setError('');
    setShowPreview(false);
  };

  const hasChanges = content !== originalContent;

  if (loading) {
    return (
      <div className="content-editor">
        <h2>Homepage Content Editor</h2>
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="content-editor">
      <h2>Homepage Content Editor</h2>
      
      <div className="editor-info">
        <p><strong>📝 Edit Homepage Opening Paragraph:</strong></p>
        <ul>
          <li>Edit the opening paragraph that appears on the homepage</li>
          <li>HTML tags are supported (e.g., &lt;br /&gt;, &lt;a&gt;, &lt;strong&gt;)</li>
          <li>Use the preview function to see how it will look</li>
          <li>Changes are saved to the database and appear immediately on the homepage</li>
        </ul>
      </div>

      <div className="editor-controls">
        <div className="button-group">
          <button 
            className="preview-button"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button 
            className="cancel-button"
            onClick={handleCancel}
            disabled={!hasChanges}
          >
            Cancel
          </button>
        </div>
        
        {hasChanges && (
          <p className="changes-indicator">
            ⚠️ You have unsaved changes
          </p>
        )}
      </div>

      <div className="editor-layout">
        <div className="textarea-container">
          <h3>Edit Content:</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="content-textarea"
            rows={12}
            placeholder="Enter your homepage content here..."
          />
          <p className="char-count">
            {content.length} characters
          </p>
        </div>

        {showPreview && (
          <div className="preview-container">
            <h3>Preview:</h3>
            <div 
              className="content-preview"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      
      <style jsx>{`
        .content-editor {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .editor-info {
          background-color: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          color: #cccccc;
        }

        .editor-info ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
          color: #cccccc;
        }

        .editor-info strong {
          color: #ffffff;
        }

        .editor-controls {
          margin-bottom: 20px;
        }

        .button-group {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .preview-button {
          padding: 10px 20px;
          background-color: #6366f1;
          color: white;
          border: 1px solid #6366f1;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .preview-button:hover {
          background-color: #5046e5;
          border-color: #5046e5;
        }

        .save-button {
          padding: 10px 20px;
          background-color: #10b981;
          color: white;
          border: 1px solid #10b981;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .save-button:hover:not(:disabled) {
          background-color: #059669;
          border-color: #059669;
        }

        .save-button:disabled {
          background-color: #404040;
          border-color: #404040;
          cursor: not-allowed;
          color: #888888;
        }

        .cancel-button {
          padding: 10px 20px;
          background-color: #6b7280;
          color: white;
          border: 1px solid #6b7280;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .cancel-button:hover:not(:disabled) {
          background-color: #4b5563;
          border-color: #4b5563;
        }

        .cancel-button:disabled {
          background-color: #404040;
          border-color: #404040;
          cursor: not-allowed;
          color: #888888;
        }

        .changes-indicator {
          color: #f59e0b;
          font-weight: 500;
          margin: 0;
        }

        .editor-layout {
          display: grid;
          grid-template-columns: ${showPreview ? '1fr 1fr' : '1fr'};
          gap: 20px;
          margin-bottom: 20px;
        }

        .textarea-container h3,
        .preview-container h3 {
          color: #ffffff;
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        .content-textarea {
          width: 100%;
          min-height: 300px;
          padding: 15px;
          background-color: #1a1a1a;
          border: 1px solid #404040;
          border-radius: 6px;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
        }

        .content-textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .char-count {
          color: #888888;
          font-size: 12px;
          margin-top: 5px;
          text-align: right;
        }

        .preview-container {
          background-color: #1a1a1a;
          border: 1px solid #404040;
          border-radius: 6px;
          padding: 15px;
        }

        .content-preview {
          color: #e0e0e0;
          line-height: 1.75;
          font-size: 1.18rem;
          font-weight: 400;
          letter-spacing: -0.01em;
          word-break: break-word;
          hyphens: auto;
        }

        .content-preview a {
          color: #4E94BF;
          text-decoration: underline;
          font-weight: 500;
        }

        .success-message {
          color: #10b981;
          font-weight: 500;
          margin-top: 15px;
        }

        .error-message {
          color: #ef4444;
          font-weight: 500;
          margin-top: 15px;
        }

        @media (max-width: 768px) {
          .editor-layout {
            grid-template-columns: 1fr;
          }
          
          .button-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentEditor; 