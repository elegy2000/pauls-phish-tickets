'use client';

import { useState, useEffect } from 'react';
import { exportToCsv, importFromCsv } from '@/utils/csvUtils';
import { Ticket } from '@/types/ticket';
import ticketsData from '@/data/tickets.json';

export default function AdminPage() {
  const [message, setMessage] = useState<string>('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState({
    year: '',
    date: '',
    venue: '',
    city_state: '',
    imageUrl: '',
    net_link: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTickets(ticketsData.tickets);
  }, []);

  const handleExport = () => {
    try {
      const csvContent = exportToCsv(tickets);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setMessage('Tickets exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      setMessage('Error exporting tickets');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('Importing tickets...');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string;
        const importedTickets = importFromCsv(csvContent);
        
        if (importedTickets.length === 0) {
          throw new Error('No valid tickets found in CSV file');
        }

        // Save to the API
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            years: [...new Set(importedTickets.map(t => t.year))],
            tickets: importedTickets
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save tickets');
        }

        setTickets(importedTickets);
        setMessage(`Successfully imported and saved ${importedTickets.length} tickets`);
        
        // Force a page reload to show the new data
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        setMessage(`Error importing CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.onerror = () => {
      setMessage('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const newTicket = {
        year: Number(form.year),
        date: form.date,
        venue: form.venue,
        city_state: form.city_state,
        imageUrl: form.imageUrl,
        net_link: form.net_link
      };
      const updatedTickets = [...tickets, newTicket];
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          years: [...new Set(updatedTickets.map(t => t.year))],
          tickets: updatedTickets
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save ticket');
      }
      setTickets(updatedTickets);
      setForm({ year: '', date: '', venue: '', city_state: '', imageUrl: '', net_link: '' });
      setMessage('Ticket added successfully');
    } catch (error) {
      setMessage(`Error adding ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Export Tickets</h2>
            <button
              onClick={handleExport}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export to CSV
            </button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Import Tickets</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Add Ticket</h2>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input name="year" type="number" placeholder="Year" value={form.year} onChange={handleFormChange} required className="border rounded px-3 py-2" />
              <input name="date" type="date" placeholder="Date" value={form.date} onChange={handleFormChange} required className="border rounded px-3 py-2" />
              <input name="venue" type="text" placeholder="Venue" value={form.venue} onChange={handleFormChange} required className="border rounded px-3 py-2" />
              <input name="city_state" type="text" placeholder="City/State" value={form.city_state} onChange={handleFormChange} required className="border rounded px-3 py-2" />
              <input name="imageUrl" type="text" placeholder="Image URL (optional)" value={form.imageUrl} onChange={handleFormChange} className="border rounded px-3 py-2 md:col-span-2" />
              <input name="net_link" type="text" placeholder="Net Link (optional)" value={form.net_link} onChange={handleFormChange} className="border rounded px-3 py-2 md:col-span-2" />
              <button type="submit" disabled={submitting} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors md:col-span-2">
                {submitting ? 'Adding...' : 'Add Ticket'}
              </button>
            </form>
          </div>

          {message && (
            <div className={`p-6 rounded-lg shadow-lg ${
              message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Current Tickets</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Venue</th>
                    <th className="px-6 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 border-b border-gray-200">{ticket.year}</td>
                      <td className="px-6 py-4 border-b border-gray-200">{ticket.date}</td>
                      <td className="px-6 py-4 border-b border-gray-200">{ticket.venue}</td>
                      <td className="px-6 py-4 border-b border-gray-200">{ticket.city_state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 