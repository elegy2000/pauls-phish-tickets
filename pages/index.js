import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getServerSideProps() {
  try {
    // TEMP: Log Supabase URL and anon key for debugging
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Fetch all years and show counts directly from Supabase
    const { data: yearData, error: yearError } = await supabase
      .from('ticket_stubs')
      .select('year')
      .order('year', { ascending: false })
      .range(0, 9999);

    if (yearError) {
      console.error('Error fetching years:', yearError);
      return {
        props: {
          years: [],
          yearCounts: {},
          error: yearError.message
        }
      };
    }

    // Debug: Log raw yearData to Vercel logs
    console.log('Raw yearData from Supabase:', yearData);

    // Count shows per year, robust to string/number/whitespace
    const yearCounts = {};
    yearData.forEach(ticket => {
      let year = ticket.year;
      if (typeof year === 'string') year = year.trim();
      year = Number(year);
      if (year && !isNaN(year)) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    const years = Object.keys(yearCounts).map(Number).sort((a, b) => b - a);

    return {
      props: {
        years,
        yearCounts,
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

export default function HomePage({ years, yearCounts, error }) {
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
              {yearCounts[year]} shows
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
} 