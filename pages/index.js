import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

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
    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
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
    <>
      <Head>
        <title>Phish Ticket Stub Archive</title>
      </Head>
      <main style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'left', marginBottom: '2.5rem' }}>
          <img
            src="https://hykzrxjtkpssrfmcerky.supabase.co/storage/v1/object/public/site-assets/logo.png"
            alt="Phish Ticket Stub Archive Logo"
            style={{
              width: '220px',
              maxWidth: '90vw',
              height: 'auto',
              margin: '0 0 1.5rem 0',
              display: 'block',
              filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.25))',
            }}
          />
          <p style={{
            fontSize: '1.15rem',
            color: '#e0e0e0',
            lineHeight: 1.7,
            margin: '0 0 0.5rem 0',
            fontWeight: 400,
            maxWidth: '650px',
            textAlign: 'left',
            letterSpacing: '-0.01em',
          }}>
            Throughout Phish's storied career, nothing built the anticipation of a new tour like receiving your tickets in the mail, nothing signaled showtime like having your ticket ripped (and in later years scanned) at the door. That's because Phish tickets are so much more than entry passes—they're memories, shared experiences, individual works of art as unique as the shows themselves.<br /><br />
            While the days of physical tickets are sadly behind us, this ticket stub archive aims to keep this important aspect of Phish's history and the live music experience alive. Inspired by the now-offline The Golgi Project, this resource catalogs years of Phish ticket art all in one place.<br /><br />
            Huge thanks to early contributors Corey Girouard, Steve Bekkala, and Liron Unreich for helping to get this site off the ground. If you spot a show that's missing or have a better-quality scan, please contribute by sending your stubs or suggestions to <a href="mailto:phishticketstubs@gmail.com" style={{ color: '#4E94BF', textDecoration: 'underline', fontWeight: 500 }}>phishticketstubs@gmail.com</a>.
          </p>
        </div>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                marginTop: '2rem',
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

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: windowWidth < 640 ? '1fr' : 
                                windowWidth < 1024 ? 'repeat(2, 1fr)' :
                                'repeat(3, 1fr)', 
            gap: '1.5rem',
            margin: '0 auto'
          }}>
            {years.map((year, index) => {
              const yearImageUrl = `https://hykzrxjtkpssrfmcerky.supabase.co/storage/v1/object/public/year-images/${year}.jpg`;
              return (
                <Link 
                  key={year} 
                  href={`/year/${year}`}
                  style={{
                    display: 'block',
                    padding: '1rem 1rem',
                    backgroundColor: '#232323',
                    border: '1.5px solid #333',
                    borderRadius: '1rem',
                    textDecoration: 'none',
                    color: '#ffffff',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.7)',
                    minHeight: '420px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2a2a2a';
                    e.target.style.borderColor = '#404040';
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#1a1a1a';
                    e.target.style.borderColor = '#2a2a2a';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '360px',
                    marginBottom: '0.5rem',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    background: '#232323',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #222',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  }}>
                    <img
                      src={yearImageUrl}
                      alt={`Ticket stubs for ${year}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transition: 'transform 0.3s ease',
                        display: 'block',
                        background: '#181818',
                      }}
                      onError={e => {
                        e.target.src = '/placeholder-ticket.jpg';
                        e.target.onerror = null;
                      }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    />
                  </div>
                  <span style={{ 
                    display: 'block', 
                    fontSize: '2.25rem',
                    fontWeight: '700',
                    marginBottom: '0.25rem',
                    color: '#ffffff',
                    marginTop: '1.25rem',
                  }}>
                    {year}
                  </span>
                  <span style={{
                    fontSize: '1.15rem',
                    color: '#a0a0a0',
                    fontWeight: '500',
                    marginBottom: '0.25rem',
                  }}>
                    {yearCounts[year]} shows
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ maxWidth: '1400px', margin: '3rem auto 0 auto', textAlign: 'right' }}>
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
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              marginTop: '2rem',
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
      </main>
    </>
  );
} 