'use client';

import { useEffect, useState } from 'react';
import { Ticket } from '@/types/ticket';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TicketList from './components/TicketList';

interface TicketsData {
  years: number[];
  tickets: Ticket[];
}

export default function YearPage() {
  const params = useParams();
  const yearParam = params.year as string;
  const yearValue = parseInt(yearParam);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        // Use window.location.origin to ensure it works in any environment
        const origin = window.location.origin;
        const apiUrl = `${origin}/api/tickets`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API returned status: ${response.status}`);
        }
        
        const data: TicketsData = await response.json();
        
        const yearTickets = data.tickets
          .filter(ticket => ticket.year === yearValue)
          .sort((a, b) => {
            // Handle date parsing safely
            try {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            } catch (e) {
              return 0;
            }
          });
        
        setTickets(yearTickets);
      } catch (error) {
        console.error('Error loading tickets:', error);
        setError('Failed to load tickets. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    if (yearValue) {
      fetchTickets();
    }
  }, [yearValue]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1rem 0', 
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e5e7eb' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link 
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#6b7280',
                marginRight: '1rem',
                textDecoration: 'none'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span style={{ marginLeft: '0.5rem' }}>Home</span>
            </Link>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '500', 
              color: '#111827',
              paddingLeft: '1rem',
              borderLeft: '1px solid #e5e7eb'
            }}>
              {yearValue}
            </h1>
            <span style={{ 
              marginLeft: '0.75rem', 
              fontSize: '0.875rem', 
              color: '#6b7280' 
            }}>
              {tickets.length} shows
            </span>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ color: '#6b7280' }}>Loading tickets...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626' }}>Error</h2>
            <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>{error}</p>
            <Link 
              href="/" 
              style={{
                display: 'inline-block',
                marginTop: '1.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.25rem',
                textDecoration: 'none'
              }}
            >
              Return to Home
            </Link>
          </div>
        ) : tickets.length > 0 ? (
          <TicketList tickets={tickets} yearValue={yearValue} />
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
              No tickets found for {yearValue}
            </h2>
            <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
              There are no tickets available for this year.
            </p>
            <Link 
              href="/" 
              style={{
                display: 'inline-block',
                marginTop: '1.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.25rem',
                textDecoration: 'none'
              }}
            >
              Return to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 