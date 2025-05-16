import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

function HomePage() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load the tickets data to display years
    const fetchData = async () => {
      try {
        const response = await fetch('/api/years');
        if (response.ok) {
          const data = await response.json();
          setYears(data.years || []);
        }
      } catch (error) {
        console.error('Error fetching years:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home-page">
      <h1>Phish Tour Archives</h1>
      
      <div className="admin-link">
        <Link href="/admin" legacyBehavior>
          <a>Admin Dashboard</a>
        </Link>
      </div>

      {loading ? (
        <p>Loading tour data...</p>
      ) : years.length > 0 ? (
        <div className="years-list">
          <h2>Available Tour Years</h2>
          <ul>
            {years.map(year => (
              <li key={year}>
                <Link href={`/year/${year}`} legacyBehavior>
                  <a>{year}</a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="no-data">
          <p>No tour data available. Please visit the admin page to upload data.</p>
          <button onClick={() => router.push('/admin')}>
            Go to Admin
          </button>
        </div>
      )}

      <style jsx>{`
        .home-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        h1 {
          text-align: center;
          margin-bottom: 30px;
        }

        .admin-link {
          text-align: right;
          margin-bottom: 20px;
        }

        .admin-link a {
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          border-radius: 4px;
          text-decoration: none;
        }

        .years-list {
          margin-top: 20px;
        }

        .years-list ul {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 15px;
          list-style: none;
          padding: 0;
        }

        .years-list li {
          text-align: center;
        }

        .years-list a {
          display: block;
          padding: 15px;
          background-color: #f4f4f4;
          border-radius: 8px;
          text-decoration: none;
          color: #333;
          font-weight: bold;
          transition: background-color 0.2s;
        }

        .years-list a:hover {
          background-color: #e4e4e4;
        }

        .no-data {
          text-align: center;
          margin-top: 40px;
        }

        .no-data button {
          padding: 10px 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
        }

        .no-data button:hover {
          background-color: #0051a8;
        }
      `}</style>
    </div>
  );
}

export default HomePage; 