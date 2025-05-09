'use client';

import { Ticket } from '@/types/ticket';
import Link from 'next/link';
import { TicketImage } from '@/app/components/TicketImage';

interface TicketListProps {
  tickets: Ticket[];
  yearValue: number;
}

export default function TicketList({ tickets, yearValue }: TicketListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}, ${yearValue}`;
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: '1.5rem',
      marginBottom: '2rem' 
    }}>
      {tickets.map((ticket, index) => (
        <div 
          key={index}
          style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            border: '1px solid #e5e7eb',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Image Section - Does not link to phish.net */}
          <div style={{ 
            position: 'relative',
            aspectRatio: '10/7', 
            backgroundColor: '#f3f4f6',
            overflow: 'hidden',
            cursor: 'pointer'
          }}>
            <TicketImage imageUrl={ticket.imageUrl || '/images/default-show.jpg'} venue={ticket.venue} />
          </div>
          
          {/* Details Section - Links to phish.net */}
          <Link 
            href={ticket.net_link || '#'} 
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1
            }}
          >
            <div style={{ 
              position: 'relative',
              padding: '1.5rem',
              backgroundColor: 'rgba(255,255,255,0.8)',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginBottom: '0.25rem',
                color: '#111827'
              }}>
                {formatDate(ticket.date)}
              </h3>
              <p style={{ 
                fontSize: '1.125rem', 
                fontWeight: '500', 
                marginBottom: '0.25rem',
                color: '#374151' 
              }}>
                {ticket.venue}
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280' 
              }}>
                {ticket.city_state}
              </p>
              {ticket.net_link && (
                <div style={{ 
                  marginTop: 'auto', 
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    View on Phish.net
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '0.25rem' }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 