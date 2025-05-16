import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

function YearPage() {
  const router = useRouter();
  const { year } = router.query;
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [windowWidth, setWindowWidth] = useState(1024);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    // Only fetch data when the year parameter is available
    if (year) {
      fetchShowsForYear(year);
    }
  }, [year]);

  const fetchShowsForYear = async (yearParam) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shows?year=${yearParam}`);
      
      if (response.ok) {
        const data = await response.json();
        setShows(data.shows || []);
      } else {
        setError('Failed to load show data');
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
      setError('Failed to load show data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    // Replace broken images with a placeholder
    e.target.src = '/placeholder-ticket.jpg';
    e.target.onerror = null; // Prevent infinite loop if placeholder also fails
  };

  if (!year) {
    return <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link 
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: '1.5rem',
            color: '#2563eb',
            textDecoration: 'none'
          }}
        >
          ← Back to Years
        </Link>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem' 
        }}>
          Phish Shows - {year}
        </h1>

        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '3rem 0' 
          }}>
            <p style={{ color: '#6b7280' }}>Loading shows...</p>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 0', 
            color: '#ef4444' 
          }}>
            {error}
          </div>
        ) : shows.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: windowWidth < 640 ? '1fr' : 
                                windowWidth < 768 ? 'repeat(2, 1fr)' : 
                                'repeat(3, 1fr)', 
            gap: '1.5rem',
            margin: '0 auto'
          }}>
            {shows.map((show, index) => (
              <div 
                key={index}
                style={{
                  display: 'block',
                  overflow: 'hidden',
                  borderRadius: '0.5rem',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                {show.imageUrl && (
                  <div style={{ 
                    height: '180px', 
                    overflow: 'hidden', 
                    position: 'relative',
                    backgroundColor: '#f3f4f6',
                    cursor: 'pointer' 
                  }}
                    onClick={() => setLightboxImage(show.imageUrl)}
                  >
                    <img
                      src={show.imageUrl}
                      alt={`Ticket for ${show.date} at ${show.venue}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={handleImageError}
                    />
                  </div>
                )}
                
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '1.25rem', 
                    marginBottom: '0.5rem' 
                  }}>
                    {show.date}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem' 
                  }}>
                    <div style={{ color: '#4b5563' }}>
                      {show.venue}
                    </div>
                    <div style={{ color: '#4b5563' }}>
                      {show.location}
                    </div>
                    {show.netLink && (
                      <a
                        href={show.netLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: '0.5rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.25rem',
                          textDecoration: 'none',
                          fontSize: '0.875rem'
                        }}
                      >
                        View on Phish.net
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 0' 
          }}>
            <p>No shows found for {year}.</p>
          </div>
        )}
      </div>
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              boxShadow: '0 4px 32px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '2rem',
                cursor: 'pointer',
                zIndex: 1001
              }}
              aria-label="Close"
            >
              ×
            </button>
            <img
              src={lightboxImage}
              alt="Full Ticket Stub"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                borderRadius: '8px',
                background: '#fff',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default YearPage; 