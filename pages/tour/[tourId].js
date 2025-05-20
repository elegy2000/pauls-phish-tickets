import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TourPage() {
  const router = useRouter();
  const { tourId } = router.query;
  const [tour, setTour] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tourId) return;

    const fetchTourData = async () => {
      try {
        setLoading(true);
        
        // First fetch the tour info
        const toursResponse = await fetch('/data/tours.json');
        if (!toursResponse.ok) {
          throw new Error('Failed to fetch tour data');
        }
        
        const toursData = await toursResponse.json();
        const tourName = decodeURIComponent(tourId).replace(/_/g, ' ');
        const tourInfo = toursData.tours.find(t => t.year === tourName);
        
        if (!tourInfo) {
          throw new Error(`Tour "${tourName}" not found`);
        }
        
        setTour(tourInfo);
        
        // Then fetch the show tickets for this tour
        const tourJsonName = tourName.replace(/\s+/g, '_');
        const ticketsResponse = await fetch(`/data/${tourJsonName}_tour.json`);
        
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          // Data format could be different, handle both possibilities
          setTickets(ticketsData.tickets || ticketsData.shows || []);
        } else {
          console.warn(`No tickets found for tour ${tourName}`);
          setTickets([]);
        }
      } catch (err) {
        console.error('Error fetching tour data:', err);
        setError(err.message || 'Failed to load tour information');
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p>Loading tour data...</p>
        </div>
      </div>
    );
  }

  if (error || !tour) {
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
            ← Back to Tours
          </Link>
          <p style={{ color: 'red' }}>{error || 'Tour not found'}</p>
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
          ← Back to Tours
        </Link>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '2rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {tour.year}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>Dates:</span> {tour.dates}
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>Shows:</span> {tour.shows}
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>Venues:</span> {tour.venues ? tour.venues.join(', ') : 'N/A'}
              </p>
            </div>
            
            {tour.imageUrl && (
              <div>
                <img 
                  src={tour.imageUrl} 
                  alt={`${tour.year} tour`}
                  style={{
                    maxWidth: '300px',
                    height: 'auto',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-ticket.jpg';
                    e.target.onerror = null;
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {tickets && tickets.length > 0 ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Tour Tickets
            </h2>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {tickets.map((ticket, index) => (
                <div 
                  key={index}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    backgroundColor: 'white'
                  }}
                >
                  {ticket.imageUrl && (
                    <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
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
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                      {ticket.date}
                    </div>
                    <div style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                      {ticket.venue}
                    </div>
                    <div style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                      {ticket.city_state}
                    </div>
                    {ticket.net_link && (
                      <a
                        href={ticket.net_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          marginTop: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          color: '#2563eb',
                          border: '1px solid #2563eb',
                          borderRadius: '0.25rem',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s, color 0.2s'
                        }}
                      >
                        View on Phish.net
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
              No tickets available
            </h2>
            <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
              There are no tickets available for this tour.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 