'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Ticket {
  year: number;
  date: string;
  venue: string;
  city_state: string;
  imageUrl: string;
  net_link: string;
}

interface TicketsData {
  years: number[];
  tickets: Ticket[];
}

export default function Home() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    // Set initial window width
    setWindowWidth(window.innerWidth);

    // Add window resize listener
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting to fetch tickets data");
        
        // Get data from API endpoint
        const apiResponse = await fetch('/api/tickets');
        if (apiResponse.ok) {
          const ticketsData: TicketsData = await apiResponse.json();
          console.log("API response:", ticketsData);
          
          // Sort the years in descending order
          const sortedYears = [...ticketsData.years].sort((a, b) => b - a);
          
          setYears(sortedYears);
        } else {
          throw new Error('Failed to fetch tickets data');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load year data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Determine number of grid columns based on window width
  const getGridColumns = () => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 768) return 2;
    return 3;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !years.length) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Error loading data'}</div>;
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>Phish Tour Archives</h1>
      
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

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Available Years</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`, 
        gap: '1.5rem',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {years.map((year) => (
          <Link 
            key={year}
            href={`/year/${year}`}
            style={{
              display: 'block',
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              // @ts-ignore
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              // @ts-ignore
              e.currentTarget.style.borderColor = '#93c5fd';
              // @ts-ignore
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              // @ts-ignore
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              // @ts-ignore
              e.currentTarget.style.borderColor = '#e5e7eb';
              // @ts-ignore
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              display: 'block',
              color: '#1f2937' 
            }}>
              {year}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
