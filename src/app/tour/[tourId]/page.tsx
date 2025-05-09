'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Show {
  id: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  setlist: string[];
  imageUrl: string;
}

interface Tour {
  year: string;
  dates: string;
  venues: string[];
  shows: number;
  imageUrl: string;
}

export default function TourPage() {
  const params = useParams();
  const tourId = params.tourId as string;
  const [tour, setTour] = useState<Tour | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        setLoading(true);
        
        // Fetch tour data from the API
        const response = await fetch(`/api/shows?year=${encodeURIComponent(tourId)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error fetching tour data: ${response.status}`);
        }
        
        const data = await response.json();
        setTour(data.tour);
        setShows(data.shows || []);
      } catch (error) {
        console.error('Error fetching tour data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load tour data');
      } finally {
        setLoading(false);
      }
    };

    if (tourId) {
      fetchTourData();
    }
  }, [tourId]);

  // Grid columns for shows display
  const getGridColumns = () => {
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2;
    return 3;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>Loading tour information...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          textAlign: 'center',
          padding: '3rem 2rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>Error</h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            {error || 'Failed to load tour information. The requested tour may not exist.'}
          </p>
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link 
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
              textDecoration: 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Years
          </Link>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            position: 'relative',
            height: '200px',
            backgroundColor: '#e5e7eb'
          }}>
            {tour.imageUrl && (
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${tour.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.7)'
              }} />
            )}
            <div style={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '2rem',
              color: 'white'
            }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{tour.year}</h1>
              <p style={{ fontSize: '1.25rem' }}>{tour.dates} • {tour.shows} shows</p>
            </div>
          </div>
          
          <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Venues</h2>
            <ul style={{ marginBottom: '2rem' }}>
              {tour.venues.map((venue, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', color: '#4b5563' }}>
                  {venue}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Shows</h2>
        
        {shows.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`, 
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {shows.map((show) => (
              <div 
                key={show.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ 
                  position: 'relative',
                  aspectRatio: '16/9', 
                  backgroundColor: '#f3f4f6',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={show.imageUrl || '/placeholder-ticket.jpg'} 
                    alt={`${show.venue} show`}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ 
                  padding: '1.5rem',
                  flexGrow: 1
                }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    marginBottom: '0.5rem',
                    color: '#111827'
                  }}>
                    {show.date}
                  </h3>
                  <p style={{ 
                    fontSize: '1rem', 
                    marginBottom: '0.5rem',
                    color: '#4b5563'
                  }}>
                    {show.venue}
                  </p>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    marginBottom: '1rem'
                  }}>
                    {show.city}, {show.state}
                  </p>
                  
                  <div style={{ marginTop: 'auto' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#4b5563', marginBottom: '0.5rem' }}>
                      Setlist:
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {show.setlist.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <p style={{ color: '#6b7280' }}>No show details available for this tour.</p>
          </div>
        )}
      </div>
    </div>
  );
} 