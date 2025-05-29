import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getServerSideProps({ params }) {
  try {
    const { year } = params;
    
    // Fetch tickets from Supabase for this year in batches of 1000
    let allTickets = [];
    let batchIndex = 0;
    const batchSize = 1000;
    while (true) {
      const { data: tickets, error } = await supabase
        .from('ticket_stubs')
        .select('*')
        .eq('year', year)
        .order('date', { ascending: true })
        .range(batchIndex * batchSize, (batchIndex + 1) * batchSize - 1);
      if (error) {
        throw error;
      }
      if (!tickets || tickets.length === 0) break;
      allTickets = allTickets.concat(tickets);
      if (tickets.length < batchSize) break;
      batchIndex++;
    }

    // Fetch all available years for navigation
    const { data: yearData, error: yearError } = await supabase
      .from('ticket_stubs')
      .select('year')
      .order('year', { ascending: true });

    let availableYears = [];
    if (!yearError && yearData) {
      availableYears = [...new Set(yearData.map(row => String(row.year)))] // Convert all to strings
        .filter(y => y && y.trim()) // Filter out empty values
        .sort((a, b) => parseInt(a) - parseInt(b)); // Sort numerically
    }

    return {
      props: {
        year: String(year), // Ensure year is a string
        initialTickets: allTickets || [],
        availableYears: availableYears || [],
        error: null
      }
    };
  } catch (error) {
    console.error('Error fetching year data:', error);
    return {
      props: {
        year: String(params.year), // Ensure year is a string
        initialTickets: [],
        availableYears: [],
        error: 'Failed to load ticket data'
      }
    };
  }
}

export default function YearPage({ year, initialTickets, availableYears, error: initialError }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Find next and previous years with proper string comparison
  const currentYear = String(year); // Ensure current year is string
  const currentYearIndex = availableYears.findIndex(y => String(y) === currentYear);
  const previousYear = currentYearIndex > 0 ? availableYears[currentYearIndex - 1] : null;
  const nextYear = currentYearIndex >= 0 && currentYearIndex < availableYears.length - 1 ? availableYears[currentYearIndex + 1] : null;

  // Debug logging (remove after testing)
  console.log('Year Navigation Debug:', {
    currentYear,
    availableYears,
    currentYearIndex,
    previousYear,
    nextYear
  });

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

  // Navigation button component
  const YearNavButton = ({ href, children, disabled = false }) => {
    if (disabled) {
      return (
        <div
          style={{
            display: 'inline-block',
            padding: '0.875rem 1.75rem',
            backgroundColor: '#111111',
            color: '#555555',
            border: '1px solid #222222',
            borderRadius: '0.75rem',
            fontWeight: '500',
            fontSize: '0.95rem',
            cursor: 'not-allowed',
            opacity: 0.5
          }}
        >
          {children}
        </div>
      );
    }

    return (
      <Link 
        href={href}
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
        {children}
      </Link>
    );
  };

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
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
              ← Back to Years
            </Link>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <YearNavButton 
                href={previousYear ? `/year/${previousYear}` : '#'}
                disabled={!previousYear}
              >
                ← Previous Year {previousYear && `(${previousYear})`}
              </YearNavButton>
              <YearNavButton 
                href={nextYear ? `/year/${nextYear}` : '#'}
                disabled={!nextYear}
              >
                Next Year {nextYear && `(${nextYear})`} →
              </YearNavButton>
            </div>
          </div>
          <p style={{ color: '#ef4444', fontSize: '1.1rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f0f0f',
      color: '#ffffff',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
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
            ← Back to Years
          </Link>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <YearNavButton 
              href={previousYear ? `/year/${previousYear}` : '#'}
              disabled={!previousYear}
            >
              ← Previous Year {previousYear && `(${previousYear})`}
            </YearNavButton>
            <YearNavButton 
              href={nextYear ? `/year/${nextYear}` : '#'}
              disabled={!nextYear}
            >
              Next Year {nextYear && `(${nextYear})`} →
            </YearNavButton>
          </div>
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          marginBottom: '3rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          {year} Shows
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: '#888888', fontSize: '1.1rem' }}>Loading tickets...</p>
          </div>
        ) : tickets.length > 0 ? (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${windowWidth < 640 ? '280px' : '320px'}, 1fr))`,
            gap: '2rem'
          }}>
            {tickets.map((ticket, index) => (
              <div 
                key={index}
                style={{
                  border: '1px solid #2a2a2a',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  backgroundColor: '#1a1a1a',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s ease',
                  cursor: ticket.imageurl ? 'pointer' : 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
                  e.currentTarget.style.borderColor = '#404040';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.borderColor = '#2a2a2a';
                }}
              >
                {ticket.imageurl && (
                  <div 
                    style={{ 
                      height: '200px', 
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => setLightboxImage(ticket.imageurl)}
                  >
                    <img
                      src={ticket.imageurl}
                      alt={`Ticket for ${ticket.date} at ${ticket.venue}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scale(1.2)',
                        transition: 'transform 0.3s ease',
                      }}
                      onError={(e) => {
                        e.target.src = '/placeholder-ticket.jpg';
                        e.target.onerror = null;
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.25)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1.2)'}
                    />
                  </div>
                )}
                
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ 
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    color: '#ffffff'
                  }}>
                    {(() => {
                      // Always parse YYYY-MM-DD as UTC
                      const isoMatch = ticket.date && ticket.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                      if (isoMatch) {
                        const [_, y, m, d] = isoMatch;
                        // Always use UTC for display
                        return `${new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC'
                        })}`;
                      }
                      // Fallback: just show the raw date
                      return ticket.date;
                    })()}
                  </p>
                  
                  <p style={{ 
                    color: '#cccccc',
                    marginBottom: '0.25rem',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {ticket.venue}
                  </p>
                  
                  <p style={{ 
                    color: '#888888',
                    fontSize: '0.9rem',
                    marginBottom: '1.25rem',
                    fontWeight: '500'
                  }}>
                    {ticket.city_state}
                  </p>

                  {ticket.net_link && (
                    <a
                      href={ticket.net_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '0.625rem 1.25rem',
                        backgroundColor: '#1a1a1a',
                        color: '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#3b82f6';
                        e.target.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#1a1a1a';
                        e.target.style.color = '#3b82f6';
                      }}
                    >
                      View on Phish.net
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: '#888888', fontSize: '1.1rem' }}>No tickets found for {year}</p>
          </div>
        )}

        {/* Bottom Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '3rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
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
            ← Back to Years
          </Link>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <YearNavButton 
              href={previousYear ? `/year/${previousYear}` : '#'}
              disabled={!previousYear}
            >
              ← Previous Year {previousYear && `(${previousYear})`}
            </YearNavButton>
            <YearNavButton 
              href={nextYear ? `/year/${nextYear}` : '#'}
              disabled={!nextYear}
            >
              Next Year {nextYear && `(${nextYear})`} →
            </YearNavButton>
          </div>
        </div>

        {lightboxImage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setLightboxImage(null)}
          >
            <img
              src={lightboxImage}
              alt="Full size ticket"
              style={{
                maxWidth: '90%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '0.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 