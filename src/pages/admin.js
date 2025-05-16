import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CsvHandler from '../components/CsvHandler';
let ImageUploader;
try {
  ImageUploader = require('../components/ImageUploader').default;
} catch (e) {
  ImageUploader = null;
}

const AdminPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>

        <style jsx>{`
          .admin-login {
            max-width: 400px;
            margin: 50px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }

          .form-group {
            margin-bottom: 15px;
          }

          label {
            display: block;
            margin-bottom: 5px;
          }

          input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }

          button {
            width: 100%;
            padding: 10px;
            background-color: #0070f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }

          button:hover {
            background-color: #0051a8;
          }

          .error {
            color: #ff0000;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <CsvHandler />
      {ImageUploader ? (
        <ImageUploader />
      ) : (
        <div style={{color: 'red', fontWeight: 'bold', margin: '20px 0'}}>
          ImageUploader component failed to load. Please check src/components/ImageUploader.js.<br/>
          If this error persists, ensure the file exists and is error-free.
        </div>
      )}
      
      <style jsx>{`
        .admin-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h1 {
          margin-bottom: 30px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default AdminPage; 