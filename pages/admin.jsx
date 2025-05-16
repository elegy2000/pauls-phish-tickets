import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CsvHandler from '../src/components/CsvHandler';
import Link from 'next/link';
import ImageUploader from '../src/components/ImageUploader';

const AdminPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' or 'images'
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [newTicket, setNewTicket] = useState({
    year: '',
    date: '',
    venue: '',
    city_state: '',
    imageFileName: '',
    net_link: ''
  });

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

  useEffect(() => {
    // Load ticket data directly from the public folder
    const loadTickets = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        // Fetch data directly from the public file
        const response = await fetch('/data/tickets.json');
        if (!response.ok) {
          throw new Error('Failed to fetch ticket data');
        }
        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (err) {
        console.error('Error loading tickets:', err);
        setDataError('Failed to load ticket data.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleExportCsv = async () => {
    try {
      const response = await fetch('/api/download', {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'phish_tours.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        console.error('Failed to download CSV');
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/add-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Reset form and reload tickets
        setNewTicket({
          year: '',
          date: '',
          venue: '',
          city_state: '',
          imageFileName: '',
          net_link: ''
        });
        
        // Add the new ticket to the local state to avoid a full reload
        setTickets(prevTickets => [...prevTickets, data.ticket]);
        setActiveTab('tickets'); // Switch to tickets view
      } else {
        alert(`Failed to add ticket: ${data.message}`);
      }
    } catch (err) {
      console.error('Error adding ticket:', err);
      alert('Failed to add ticket. Please try again.');
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
            background: white;
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
      <div className="fixed-home-button">
        <Link 
          href="/" 
          className="blue-button"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Back to Home
        </Link>
      </div>
      
      <h1>Admin Dashboard</h1>
      
      <div className="admin-content">
        <div className="custom-warning">
          <p><strong>Important:</strong> Changes made through this interface are being saved to the GitHub repository 
          and will persist across deployments. There might be a 1-2 minute delay before changes are visible on the live site 
          as a new deployment is triggered automatically.</p>
        </div>
      
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'csv' ? 'active' : ''}`}
            onClick={() => setActiveTab('csv')}
          >
            CSV Management
          </button>
          <button
            className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Image Upload
          </button>
          <button
            className={`tab-button ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            Current Tickets
          </button>
          <button
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Ticket
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'csv' && (
            <CsvHandler />
          )}
          {activeTab === 'images' && (
            <ImageUploader />
          )}
          {activeTab === 'tickets' && (
            <div className="tickets-container">
              <h2>Current Tickets</h2>
              {isLoading && <p>Loading ticket data...</p>}
              {dataError && <p className="error">{dataError}</p>}
              
              {!isLoading && !dataError && (
                <>
                  <div className="export-section">
                    <button className="export-button" onClick={handleExportCsv}>
                      Export to CSV
                    </button>
                  </div>
                  <p>Total tickets: {tickets.length}</p>
                  <div className="table-wrapper">
                    <table className="tickets-table">
                      <thead>
                        <tr>
                          <th>YEAR</th>
                          <th>DATE</th>
                          <th>VENUE</th>
                          <th>LOCATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket, index) => (
                          <tr key={index}>
                            <td>{ticket.year}</td>
                            <td>{ticket.date}</td>
                            <td>{ticket.venue}</td>
                            <td>{ticket.city_state}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
          {activeTab === 'add' && (
            <div className="add-ticket-container">
              <h2>Add Ticket</h2>
              <form onSubmit={handleAddTicket}>
                <div className="form-group">
                  <label htmlFor="year">Year:</label>
                  <input 
                    type="text" 
                    id="year" 
                    name="year" 
                    value={newTicket.year}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date">Date:</label>
                  <input 
                    type="text" 
                    id="date" 
                    name="date" 
                    value={newTicket.date}
                    onChange={handleInputChange}
                    placeholder="mm/dd/yyyy"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="venue">Venue:</label>
                  <input 
                    type="text" 
                    id="venue" 
                    name="venue" 
                    value={newTicket.venue}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city_state">City/State:</label>
                  <input 
                    type="text" 
                    id="city_state" 
                    name="city_state" 
                    value={newTicket.city_state}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="imageFileName">Image file name (include ext.) (optional):</label>
                  <input 
                    type="text" 
                    id="imageFileName" 
                    name="imageFileName" 
                    value={newTicket.imageFileName || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="net_link">NFT Link (optional):</label>
                  <input 
                    type="text" 
                    id="net_link" 
                    name="net_link" 
                    value={newTicket.net_link}
                    onChange={handleInputChange}
                  />
                </div>
                <button type="submit">Add Ticket</button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .admin-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .fixed-home-button {
          position: fixed;
          top: 10px;
          left: 10px;
          z-index: 100;
        }
        
        .blue-button {
          display: inline-block;
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
          border: none;
          cursor: pointer;
          text-align: center;
        }
        
        .blue-button:hover {
          background-color: #0051a8;
        }
        
        .custom-warning {
          background-color: #fff9e6;
          border: 1px solid #ffd700;
          border-radius: 4px;
          padding: 10px 15px;
          margin: 10px auto 20px auto;
          width: 100%;
        }

        h1 {
          margin-bottom: 20px;
          text-align: center;
        }

        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
          gap: 20px;
        }

        .tab-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background-color: #f0f0f0;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .tab-button:hover {
          background-color: #e0e0e0;
        }

        .tab-button.active {
          background-color: #0070f3;
          color: white;
        }

        .tab-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .tickets-container {
          padding: 20px;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 20px;
        }

        .tickets-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tickets-table th,
        .tickets-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        .tickets-table th {
          background-color: #f5f5f5;
        }

        .export-section {
          margin: 20px 0;
        }

        .export-button {
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .export-button:hover {
          background-color: #0051a8;
        }

        .add-ticket-container {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }

        .add-ticket-container form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .add-ticket-container button {
          margin-top: 10px;
          padding: 10px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default AdminPage; 