import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getServerSideProps() {
  try {
    // Fetch tickets from Supabase
    const { data: tickets, error } = await supabase
      .from('ticket_stubs')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return {
        props: {
          tickets: [],
          error: error.message
        }
      };
    }

    // Get unique years for filtering
    const years = [...new Set(tickets.map(ticket => new Date(ticket.date).getFullYear()))].sort((a, b) => b - a);

    return {
      props: {
        tickets,
        years,
        error: null
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        tickets: [],
        years: [],
        error: error.message
      }
    };
  }
}

export default function HomePage({ tickets, years, error }) {
  const [windowWidth, setWindowWidth] = useState(1024);

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
      <main style={{ minHeight: '100vh', padding: '2rem' }}>
        <h1 style={{ color: 'red', textAlign: 'center' }}>Error loading data: {error}</h1>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: '2rem' 
      }}>Phish Tour Archives</h1>
      
      <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
        <Link 
          href="/admin"
          style={{ 
            display: 'inline-block', 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#2563eb', 
            color: 'white', 
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 'medium'
          }}
        >
          Admin Dashboard
        </Link>
      </div>

      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem' 
      }}>Available Tour Years</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: windowWidth < 640 ? '1fr' : 
                            windowWidth < 768 ? 'repeat(2, 1fr)' : 
                            'repeat(3, 1fr)', 
        gap: '1rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {years.map((year, index) => (
          <Link 
            key={year} 
            href={`/year/${year}`}
            style={{
              display: 'block',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.15s, background-color 0.15s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              ':hover': {
                backgroundColor: '#f3f4f6',
                transform: 'scale(1.02)'
              }
            }}
          >
            <span style={{ 
              display: 'block', 
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '0.25rem' 
            }}>
              {year}
            </span>
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              {tickets.filter(t => new Date(t.date).getFullYear() === year).length} shows
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
} 