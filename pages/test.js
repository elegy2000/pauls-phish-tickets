import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getServerSideProps() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('ticket_stubs')
      .select('count')
      .single();

    if (error) {
      throw error;
    }

    return {
      props: {
        connectionStatus: 'Connected',
        ticketCount: data?.count || 0,
        error: null
      }
    };
  } catch (error) {
    console.error('Error testing connection:', error);
    return {
      props: {
        connectionStatus: 'Error',
        ticketCount: 0,
        error: error.message
      }
    };
  }
}

export default function TestPage({ connectionStatus, ticketCount, error }) {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link 
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: '1.5rem',
            color: '#2563eb',
            textDecoration: 'none'
          }}
        >
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          System Test Page
        </h1>

        <div style={{ 
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Supabase Connection Status
          </h2>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ 
              color: error ? '#ef4444' : '#10b981',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Status: {connectionStatus}
            </p>
            {error ? (
              <p style={{ color: '#ef4444' }}>{error}</p>
            ) : (
              <p>Total tickets in database: {ticketCount}</p>
            )}
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Environment Variables
          </h2>

          <div>
            <p style={{ marginBottom: '0.5rem' }}>
              NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? '✓ Set' : '✗ Missing'}
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseAnonKey ? '✓ Set' : '✗ Missing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 