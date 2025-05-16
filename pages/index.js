import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function fetchYears() {
      try {
        const response = await fetch('/data/tickets.json');
        if (!response.ok) throw new Error('Failed to fetch years');
        const data = await response.json();
        // Ensure years are sorted descending (most recent first)
        const sortedYears = (data.years || []).slice().sort((a, b) => b - a);
        setYears(sortedYears.map(String));
      } catch (err) {
        setYears([]);
      } finally {
        setLoading(false);
      }
    }
    fetchYears();
  }, []);

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
      
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading years...</div>
      ) : (
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
              key={index} 
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
                textAlign: 'center'
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
            </Link>
          ))}
        </div>
      )}
    </main>
  );
} 