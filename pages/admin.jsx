import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CsvHandler from '../src/components/CsvHandler';
import Link from 'next/link';
import ImageUploader from '../src/components/ImageUploader';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// IMPORTANT: For security, only use this secret for initial admin setup, then remove from frontend!
const ADMIN_CREATE_SECRET = process.env.NEXT_PUBLIC_ADMIN_CREATE_SECRET || 'temp-admin-setup-secret-2024';

const AdminPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [availableImages, setAvailableImages] = useState(new Set());
  const [newTicket, setNewTicket] = useState({
    year: '',
    date: '',
    venue: '',
    city_state: '',
    imageFileName: '',
    net_link: ''
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [adminExists, setAdminExists] = useState(null); // null = loading, false = not exists, true = exists
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

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
    // Load ticket data from Supabase
    const loadTickets = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        
        // Load available images from Supabase Storage via API
        console.log('Loading images from Supabase Storage via API...');
        try {
          const imageResponse = await fetch('/api/list-images');
          const imageData = await imageResponse.json();
          
          if (imageData.success) {
            const imageNames = new Set(imageData.images || []);
            console.log('Loaded images from storage:', {
              count: imageNames.size,
              images: Array.from(imageNames).slice(0, 10), // Show first 10
              allImages: Array.from(imageNames)
            });
            setAvailableImages(imageNames);
          } else {
            console.error('Error loading images from API:', imageData.message);
            setAvailableImages(new Set());
          }
        } catch (imageError) {
          console.error('Error calling list-images API:', imageError);
          setAvailableImages(new Set());
        }
        
        // Fetch data from Supabase in batches of 1000
        let allTickets = [];
        let batchIndex = 0;
        const batchSize = 1000;
        while (true) {
          const { data: tickets, error } = await supabase
            .from('ticket_stubs')
            .select('*')
            .order('date', { ascending: false })
            .range(batchIndex * batchSize, (batchIndex + 1) * batchSize - 1);
          if (error) {
            throw error;
          }
          if (!tickets || tickets.length === 0) break;
          allTickets = allTickets.concat(tickets);
          if (tickets.length < batchSize) break;
          batchIndex++;
        }
        console.log('Loaded tickets:', {
          count: allTickets.length,
          sampleTickets: allTickets.slice(0, 3).map(t => ({
            date: t.date,
            imageurl: t.imageurl
          }))
        });
        setTickets(allTickets || []);
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

  useEffect(() => {
    // Check if admin user exists using backend API
    const checkAdminUser = async () => {
      try {
        const response = await fetch('/api/auth/admin-exists');
        const data = await response.json();
        setAdminExists(!!data.exists);
      } catch (err) {
        setAdminExists(true); // fallback: assume exists
      }
    };
    checkAdminUser();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Establish the Supabase session on the frontend
        if (data.session) {
          const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
          await supabase.auth.setSession(data.session);
        }
        
        setIsAuthenticated(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setActiveTab('tickets');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    const passed = Object.values(requirements).filter(Boolean).length;
    const total = Object.keys(requirements).length;
    
    if (passed === total) return { strength: 'Strong', color: '#10b981' };
    if (passed >= 3) return { strength: 'Medium', color: '#f59e0b' };
    return { strength: 'Weak', color: '#ef4444' };
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    
    if (password) {
      const validation = validatePassword(password);
      setPasswordStrength(validation);
    } else {
      setPasswordStrength('');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setChangePasswordError('Passwords do not match');
      return;
    }

    if (!passwordStrength || passwordStrength.strength === 'Weak') {
      setChangePasswordError('Please choose a stronger password');
      return;
    }

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setChangePasswordError('No active session found. Please log in again.');
        return;
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
          accessToken: session.access_token
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setChangePasswordError(data.error || 'Failed to change password');
      } else {
        setChangePasswordSuccess(data.message);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStrength('');
        
        // Log out user so they can log in with new password
        setTimeout(async () => {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setActiveTab('tickets');
        }, 2000);
      }
    } catch (err) {
      console.error('Change password error:', err);
      setChangePasswordError('Failed to change password. Please try again.');
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

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    console.log('Starting admin registration...', { email: registerEmail, secretUsed: ADMIN_CREATE_SECRET });
    try {
      const response = await fetch('/api/auth/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          secret: ADMIN_CREATE_SECRET,
        }),
      });
      const data = await response.json();
      console.log('Admin creation response:', { status: response.status, data });
      if (!response.ok) {
        setRegisterError(data.error || 'Failed to create admin user.');
      } else {
        setRegisterSuccess('Admin user created! You can now log in.');
        setAdminExists(true);
      }
    } catch (err) {
      console.error('Admin registration error:', err);
      setRegisterError('Failed to create admin user.');
    }
  };

  if (adminExists === false) {
    return (
      <div className="admin-register" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f', color: '#fff' }}>
        <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Create Admin User</h1>
          <form onSubmit={handleRegisterAdmin}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="registerEmail" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#ffffff' }}>Email:</label>
              <input type="email" id="registerEmail" name="registerEmail" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} required style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #404040', borderRadius: '0.5rem', color: '#ffffff', fontSize: '1rem' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="registerPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#ffffff' }}>Password:</label>
              <input type="password" id="registerPassword" name="registerPassword" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #404040', borderRadius: '0.5rem', color: '#ffffff', fontSize: '1rem' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '0.875rem', backgroundColor: '#3b82f6', color: 'white', border: '1px solid #3b82f6', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s ease' }}>Create Admin User</button>
            {registerError && <p style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{registerError}</p>}
            {registerSuccess && <p style={{ color: '#10b981', marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{registerSuccess}</p>}
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login" style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '2rem',
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
        }}>
          <h1 style={{
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '1.75rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{
              marginBottom: '1.5rem'
            }}>
              <label htmlFor="email" style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#ffffff'
              }}>Email:</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #404040',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#404040';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div className="form-group" style={{
              marginBottom: '1.5rem'
            }}>
              <label htmlFor="password" style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#ffffff'
              }}>Password:</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #404040',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#404040';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: '1px solid #3b82f6',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.borderColor = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.borderColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Login
            </button>
            {error && (
              <p style={{
                color: '#ef4444',
                marginTop: '1rem',
                textAlign: 'center',
                fontSize: '0.875rem'
              }}>{error}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ textAlign: 'right', marginBottom: '3rem' }}>
        <Link 
          href="/"
          style={{ 
            display: 'inline-block', 
            padding: '0.875rem 1.75rem', 
            backgroundColor: '#1a1a1a', 
            color: '#ffffff',
            border: '1px solid #333333',
            borderRadius: '0.75rem',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2a2a2a';
            e.target.style.borderColor = '#444444';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1a1a1a';
            e.target.style.borderColor = '#333333';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Back to Home
        </Link>
      </div>
      
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="logout-button"
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      
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
            <button
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
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
                            <th>IMAGE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket, index) => {
                            // Check if ticket has an image by extracting filename from imageurl
                            // OR by checking if any image exists for this date
                            const hasImage = (() => {
                              // Don't check if images haven't loaded yet
                              if (availableImages.size === 0) {
                                if (index < 3) {
                                  console.log(`Ticket ${ticket.date}: availableImages not loaded yet (size: ${availableImages.size})`);
                                }
                                return false;
                              }

                              try {
                                // First, check if there's a valid imageurl
                                if (ticket.imageurl && ticket.imageurl.trim()) {
                                  const url = new URL(ticket.imageurl);
                                  const filename = url.pathname.split('/').pop();
                                  const imageExists = availableImages.has(filename);
                                  
                                  // Debug logging for first few tickets
                                  if (index < 5) {
                                    console.log(`Ticket ${ticket.date} (with imageurl):`, {
                                      imageurl: ticket.imageurl,
                                      filename: filename,
                                      imageExists: imageExists,
                                      availableImagesSize: availableImages.size
                                    });
                                  }
                                  
                                  return imageExists;
                                }
                                
                                // If no imageurl, check if any image exists for this date
                                const datePattern = ticket.date; // e.g., "2022-09-02"
                                const hasImageByDate = Array.from(availableImages).some(filename => 
                                  filename.includes(datePattern)
                                );
                                
                                // Debug logging for first few tickets without imageurl
                                if (index < 5 && (!ticket.imageurl || !ticket.imageurl.trim())) {
                                  console.log(`Ticket ${ticket.date} (no imageurl):`, {
                                    imageurl: ticket.imageurl,
                                    datePattern: datePattern,
                                    hasImageByDate: hasImageByDate,
                                    availableImagesCount: availableImages.size,
                                    matchingImages: Array.from(availableImages).filter(name => name.includes(datePattern))
                                  });
                                }
                                
                                return hasImageByDate;
                              } catch (error) {
                                console.error('Error processing ticket:', ticket.date, error);
                                return false;
                              }
                            })();
                            
                            return (
                              <tr key={index}>
                                <td>{ticket.year}</td>
                                <td>{ticket.date}</td>
                                <td>{ticket.venue}</td>
                                <td>{ticket.city_state}</td>
                                <td className="image-cell">
                                  {availableImages.size === 0 ? (
                                    <span style={{color: '#666'}}>...</span>
                                  ) : hasImage ? (
                                    <span className="checkmark">✓</span>
                                  ) : (
                                    <span className="no-image">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
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
                    <label htmlFor="city_state">City, State:</label>
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
            {activeTab === 'settings' && (
              <div className="settings-container">
                <h2>Account Settings</h2>
                
                <div className="settings-section">
                  <h3>Change Password</h3>
                  <p style={{ color: '#a0a0a0', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
                  </p>
                  <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password:</label>
                      <input 
                        type="password" 
                        id="newPassword" 
                        name="newPassword" 
                        value={newPassword} 
                        onChange={handlePasswordChange} 
                        required 
                      />
                      {passwordStrength && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.875rem', 
                          color: passwordStrength.color,
                          fontWeight: '500'
                        }}>
                          Password strength: {passwordStrength.strength}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password:</label>
                      <input 
                        type="password" 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <button type="submit">Change Password</button>
                    {changePasswordError && (
                      <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}>
                        {changePasswordError}
                      </p>
                    )}
                    {changePasswordSuccess && (
                      <p style={{ color: '#10b981', marginTop: '1rem', fontSize: '0.875rem' }}>
                        {changePasswordSuccess}
                      </p>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          background-color: #0f0f0f !important;
          color: #ffffff !important;
          margin: 0;
          padding: 0;
        }
        
        html {
          background-color: #0f0f0f !important;
        }
      `}</style>
      
      <style jsx>{`
        .admin-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          background-color: #0f0f0f;
          color: #ffffff;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .admin-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .custom-warning {
          background-color: #1a1a1a;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 15px 20px;
          margin: 10px auto 20px auto;
          width: 100%;
          color: #fbbf24;
        }

        h1 {
          margin-bottom: 20px;
          text-align: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 2.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
          gap: 20px;
        }

        .tab-button {
          padding: 12px 24px;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          background-color: #1a1a1a;
          color: #ffffff;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .tab-button:hover {
          background-color: #2a2a2a;
          border-color: #404040;
        }

        .tab-button.active {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .tab-content {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .tickets-container {
          padding: 20px;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 20px;
          border-radius: 8px;
        }

        .tickets-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #1a1a1a;
        }

        .tickets-table th,
        .tickets-table td {
          border: 1px solid #2a2a2a;
          padding: 12px 8px;
          text-align: left;
          color: #ffffff;
        }

        .tickets-table th {
          background-color: #2a2a2a;
          font-weight: 600;
          color: #ffffff;
        }

        .tickets-table tr:hover {
          background-color: #222222;
        }

        .image-cell {
          text-align: center;
          font-weight: bold;
        }

        .checkmark {
          color: #10b981;
          font-size: 16px;
        }

        .no-image {
          color: #ef4444;
          font-size: 16px;
        }

        .export-section {
          margin: 20px 0;
        }

        .export-button {
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .export-button:hover {
          background-color: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
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

        .add-ticket-container .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .add-ticket-container label {
          color: #ffffff;
          font-weight: 500;
          font-size: 14px;
        }

        .add-ticket-container input {
          padding: 10px 12px;
          background-color: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 6px;
          color: #ffffff;
          font-size: 14px;
        }

        .add-ticket-container input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .add-ticket-container button {
          margin-top: 10px;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .add-ticket-container button:hover {
          background-color: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
        }

        .settings-container {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }

        .settings-section {
          margin-bottom: 20px;
        }

        .settings-section h3 {
          margin-bottom: 10px;
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
        }

        .settings-section p {
          margin-bottom: 10px;
          color: #a0a0a0;
          font-size: 0.9rem;
        }

        .settings-section form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .settings-section .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .settings-section label {
          color: #ffffff;
          font-weight: 500;
          font-size: 14px;
        }

        .settings-section input {
          padding: 10px 12px;
          background-color: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 6px;
          color: #ffffff;
          font-size: 14px;
        }

        .settings-section input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .settings-section button {
          margin-top: 10px;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .settings-section button:hover {
          background-color: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default AdminPage;

export async function getServerSideProps() {
  try {
    // Fetch tickets from Supabase in batches of 1000
    let allTickets = [];
    let batchIndex = 0;
    const batchSize = 1000;
    while (true) {
      const { data: tickets, error } = await supabase
        .from('ticket_stubs')
        .select('*')
        .order('date', { ascending: false })
        .range(batchIndex * batchSize, (batchIndex + 1) * batchSize - 1);
      if (error) {
        console.error('Error fetching tickets:', error);
        return {
          props: {
            tickets: [],
            error: error.message
          }
        };
      }
      if (!tickets || tickets.length === 0) break;
      allTickets = allTickets.concat(tickets);
      if (tickets.length < batchSize) break;
      batchIndex++;
    }
    return {
      props: {
        tickets: allTickets,
        error: null
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        tickets: [],
        error: error.message
      }
    };
  }
} 