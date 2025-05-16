import React from 'react';
import Link from 'next/link';

function Error({ statusCode }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        width: '100%', 
        textAlign: 'center', 
        padding: '3rem 2rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>
          {statusCode 
            ? `An error ${statusCode} occurred on server` 
            : 'An error occurred on client'}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Sorry, something went wrong. Please try again later.
        </p>
        <Link 
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 