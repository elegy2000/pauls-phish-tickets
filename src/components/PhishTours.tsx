'use client';

import { useState, useEffect } from 'react';

type TourData = {
  year: number;
  name: string;
  show_count: number;
  sample_url: string;
  has_shows?: boolean;  // New field to track if shows exist
};

type ToursResponse = {
  tours: TourData[];
};

export default function PhishTours() {
  const [tours, setTours] = useState<TourData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both tours and shows data
        const [toursResponse, showsResponse] = await Promise.all([
          fetch('/data/tours.json'),
          fetch('/data/all_shows.json')
        ]);
        
        if (!toursResponse.ok || !showsResponse.ok) {
          throw new Error(`Failed to fetch data: ${toursResponse.status} ${showsResponse.status}`);
        }
        
        const toursData: ToursResponse = await toursResponse.json();
        const showsData = await showsResponse.json();
        
        // Create a map of tours that have shows
        const toursWithShows = new Set(
          showsData.map((show: any) => show.year)
        );
        
        // Add has_shows flag to each tour
        const updatedTours = toursData.tours.map(tour => ({
          ...tour,
          has_shows: toursWithShows.has(tour.year)
        }));
        
        setTours(updatedTours);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tour data:', err);
        setError('Failed to load Phish tour data. Please try again later.');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Group tours by year
  const toursByYear = tours.reduce<Record<number, TourData[]>>((acc, tour) => {
    if (!acc[tour.year]) {
      acc[tour.year] = [];
    }
    acc[tour.year].push(tour);
    return acc;
  }, {});

  // Get sorted years
  const years = Object.keys(toursByYear)
    .map(Number)
    .sort((a, b) => b - a); // Sort in descending order (newest first)

  const toggleYear = (year: number) => {
    if (expandedYear === year) {
      setExpandedYear(null);
    } else {
      setExpandedYear(year);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading Phish tour data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Phish Tour History</h1>
      
      <div className="space-y-4">
        {years.map(year => (
          <div key={year} className="border rounded-lg overflow-hidden">
            <div 
              className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-200"
              onClick={() => toggleYear(year)}
            >
              <h2 className="text-xl font-semibold">{year}</h2>
              <span className="text-sm text-gray-600">
                {toursByYear[year].length} tours, 
                {toursByYear[year].reduce((total, tour) => total + tour.show_count, 0)} shows
              </span>
              <button className="text-blue-500">
                {expandedYear === year ? '▲' : '▼'}
              </button>
            </div>
            
            {expandedYear === year && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tour Name</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Shows</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {toursByYear[year].map((tour, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3">{tour.name}</td>
                          <td className="px-4 py-3">{tour.show_count} shows</td>
                          <td className="px-4 py-3">
                            {tour.has_shows ? (
                              <span className="text-green-600">✓ Shows Available</span>
                            ) : (
                              <span className="text-yellow-600">⚠ No Shows Yet</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <a 
                              href={tour.sample_url} 
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 