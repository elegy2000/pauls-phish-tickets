import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TicketData() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        // Fetch data directly from the public file
        const response = await fetch('/data/tickets.json');
        if (!response.ok) {
          throw new Error('Failed to fetch ticket data');
        }
        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (err) {
        console.error('Error loading tickets:', err);
        setError('Failed to load ticket data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTickets();
  }, []);

  return (
    <div className="container">
      <h1>Ticket Data Diagnostic</h1>
      <p>This page tests direct access to ticket data from the public folder.</p>
      
      <Link href="/admin">
        <a className="back-link">Back to Admin</a>
      </Link>

      {isLoading && <p>Loading ticket data...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && !error && (
        <>
          <h2>Tickets Found: {tickets.length}</h2>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={index}>
                    <td>{ticket.year}</td>
                    <td>{ticket.date}</td>
                    <td>{ticket.venue}</td>
                    <td>{ticket.city_state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .back-link {
          display: inline-block;
          margin-bottom: 20px;
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }
        
        .error {
          color: red;
          font-weight: bold;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f2f2f2;
        }
        
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      `}</style>
    </div>
  );
} 