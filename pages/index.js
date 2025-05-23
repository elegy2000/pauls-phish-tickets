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

    // Fetch all years and show counts directly from Supabase in batches of 1000
    let allYearData = [];
    let batchIndex = 0;
    const batchSize = 1000;
    while (true) {
      const { data: yearData, error: yearError } = await supabase
        .from('ticket_stubs')
        .select('year')
        .order('year', { ascending: false })
        .range(batchIndex * batchSize, (batchIndex + 1) * batchSize - 1);
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
      if (!yearData || yearData.length === 0) break;
      allYearData = allYearData.concat(yearData);
      if (yearData.length < batchSize) break;
      batchIndex++;
    }
    // Count shows per year, robust to string/number/whitespace
    const yearCounts = {};
    allYearData.forEach(ticket => {
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
    <main style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f0f0f',
      color: '#ffffff',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '700', 
          textAlign: 'center', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>Phish Tour Archives</h1>
        
        <p style={{
          textAlign: 'center',
          color: '#888888',
          fontSize: '1.1rem',
          marginBottom: '3rem',
          fontWeight: '400'
        }}>
          Paul's Ticket Stub Collection
        </p>
        
        <div style={{ textAlign: 'right', marginBottom: '3rem' }}>
          <Link 
            href="/admin"
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
            Admin Dashboard
          </Link>
        </div>

        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '600', 
          marginBottom: '2rem',
          color: '#ffffff',
          textAlign: 'center'
        }}>Available Tour Years</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: windowWidth < 640 ? '1fr' : 
                              windowWidth < 768 ? 'repeat(2, 1fr)' : 
                              windowWidth < 1024 ? 'repeat(3, 1fr)' :
                              'repeat(4, 1fr)', 
          gap: '1.25rem',
          margin: '0 auto'
        }}>
          {years.map((year, index) => (
            <Link 
              key={year} 
              href={`/year/${year}`}
              style={{
                display: 'block',
                padding: '2rem 1.5rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '1rem',
                textDecoration: 'none',
                color: '#ffffff',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2a2a2a';
                e.target.style.borderColor = '#404040';
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#1a1a1a';
                e.target.style.borderColor = '#2a2a2a';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                opacity: 0.8
              }} />
              <span style={{ 
                display: 'block', 
                fontSize: '1.75rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                color: '#ffffff'
              }}>
                {year}
              </span>
              <span style={{
                fontSize: '0.95rem',
                color: '#a0a0a0',
                fontWeight: '500'
              }}>
                {yearCounts[year]} shows
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
} 