'use client';

import { useState, useEffect } from 'react';

type ShowData = {
  year: string;
  date: string;
  venue: string;
  location: string;
  imageUrl: string;
  netLink: string;
};

export default function PhishTourData() {
  const [shows, setShows] = useState<ShowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  const showsPerPage = 20;

  useEffect(() => {
    async function fetchData() {
      try {
        // Add timestamp to prevent browser caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/data/all_shows.json?t=${timestamp}`, {
          cache: 'no-store', // Completely bypass the browser cache
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Loaded ${data.length} shows, including ${data.filter((show: ShowData) => show.year === "2003 Summer").length} shows for 2003 Summer`);
        setShows(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load Phish tour data. Please try again later.');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get unique years for the filter
  const years = shows.length > 0 
    ? [...new Set(shows.map(show => show.year))]
    : [];
    
  // Sort years in descending order with proper ordering
  const sortedYears = years.sort((a, b) => {
    // Extract base year from format like "2023 Summer" or "2023"
    const yearA = parseInt(a.split(' ')[0]);
    const yearB = parseInt(b.split(' ')[0]);
    
    // If different base years, sort by year in descending order
    if (yearA !== yearB) {
      return yearB - yearA;
    }
    
    // If one has no season (just year), it should come first
    const hasSeasonA = a.includes(' ');
    const hasSeasonB = b.includes(' ');
    
    if (!hasSeasonA && hasSeasonB) return -1;
    if (hasSeasonA && !hasSeasonB) return 1;
    if (!hasSeasonA && !hasSeasonB) return 0;
    
    // If both have seasons, sort by season in this order: base year, Spring, Summer, Fall, Winter
    type SeasonType = '' | 'Spring' | 'Summer' | 'Fall' | 'Winter';
    const seasonOrder: Record<SeasonType, number> = { 
      '': 0, 
      'Spring': 1, 
      'Summer': 2, 
      'Fall': 3, 
      'Winter': 4 
    };
    
    const seasonA = a.split(' ')[1] as SeasonType;
    const seasonB = b.split(' ')[1] as SeasonType;
    
    return seasonOrder[seasonA] - seasonOrder[seasonB];
  });

  // Filter shows by selected year
  const filteredShows = selectedYear === 'all' 
    ? shows 
    : shows.filter(show => show.year === selectedYear);

  // Calculate pagination
  const indexOfLastShow = currentPage * showsPerPage;
  const indexOfFirstShow = indexOfLastShow - showsPerPage;
  const currentShows = filteredShows.slice(indexOfFirstShow, indexOfLastShow);
  const totalPages = Math.ceil(filteredShows.length / showsPerPage);

  // Handle page changes
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle year filter change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  if (loading) {
    return <div className="text-center p-8">Loading Phish tour data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Phish Tour History</h1>
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <label htmlFor="year-filter" className="mr-2">Filter by Year:</label>
          <select 
            id="year-filter" 
            value={selectedYear} 
            onChange={handleYearChange}
            className="p-2 border rounded"
          >
            <option value="all">All Years</option>
            {sortedYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          Showing {filteredShows.length} shows
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left border-b">Year</th>
              <th className="px-4 py-2 text-left border-b">Date</th>
              <th className="px-4 py-2 text-left border-b">Venue</th>
              <th className="px-4 py-2 text-left border-b">Location</th>
              <th className="px-4 py-2 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentShows.map((show, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-2 border-b">{show.year}</td>
                <td className="px-4 py-2 border-b">{show.date}</td>
                <td className="px-4 py-2 border-b">{show.venue}</td>
                <td className="px-4 py-2 border-b">{show.location}</td>
                <td className="px-4 py-2 border-b">
                  <a 
                    href={show.netLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on Phish.net
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button 
          onClick={prevPage} 
          disabled={currentPage === 1}
          className={`px-4 py-2 border rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        >
          Previous
        </button>
        
        <span>
          Page {currentPage} of {totalPages}
        </span>
        
        <button 
          onClick={nextPage} 
          disabled={currentPage === totalPages}
          className={`px-4 py-2 border rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
} 