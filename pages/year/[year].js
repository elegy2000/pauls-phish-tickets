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
    
    // Fetch tickets from Supabase for this year
    const { data: tickets, error } = await supabase
      .from('ticket_stubs')
      .select('*')
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return {
      props: {
        year,
        initialTickets: tickets || [],
        error: null
      }
    };
  } catch (error) {
    console.error('Error fetching year data:', error);
    return {
      props: {
        year: params.year,
        initialTickets: [],
        error: 'Failed to load ticket data'
      }
    };
  }
}

export default function YearPage({ year, initialTickets, error: initialError }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
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

  if (error) {
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
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </div>
    );
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

        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          {year} Shows
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p>Loading tickets...</p>
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
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                {ticket.imageUrl && (
                  <div 
                    style={{ 
                      height: '200px', 
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onClick={() => setLightboxImage(ticket.imageUrl)}
                  >
                    <img
                      src={ticket.imageUrl}
                      alt={`Ticket for ${ticket.date} at ${ticket.venue}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = '/placeholder-ticket.jpg';
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                )}
                
                <div style={{ padding: '1rem' }}>
                  <p style={{ 
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    {new Date(ticket.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  
                  <p style={{ 
                    color: '#4b5563',
                    marginBottom: '0.25rem'
                  }}>
                    {ticket.venue}
                  </p>
                  
                  <p style={{ 
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
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
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: '0.375rem',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500'
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
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p>No tickets found for {year}</p>
          </div>
        )}

        {lightboxImage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              cursor: 'pointer'
            }}
            onClick={() => setLightboxImage(null)}
          >
            <img
              src={lightboxImage}
              alt="Full size ticket"
              style={{
                maxWidth: '90%',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 