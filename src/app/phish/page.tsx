'use client';

import PhishTourData from '@/components/PhishTourData';
import PhishTours from '@/components/PhishTours';
import { useState, useEffect } from 'react';

export default function PhishPage() {
  const [activeTab, setActiveTab] = useState<'shows' | 'tours'>('tours');
  const [showsKey, setShowsKey] = useState<string>('initial');
  
  // Force remount of the Shows component when tab changes
  useEffect(() => {
    if (activeTab === 'shows') {
      // Small timeout to ensure the component remounts after tab switch animation
      setTimeout(() => {
        setShowsKey(`phish-tour-data-${Date.now()}`);
      }, 100);
    }
  }, [activeTab]);
  
  return (
    <main className="min-h-screen p-4">
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              activeTab === 'tours'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('tours')}
          >
            Tours
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              activeTab === 'shows'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('shows')}
          >
            Shows
          </button>
        </div>
      </div>
      
      {activeTab === 'tours' ? <PhishTours /> : <PhishTourData key={showsKey} />}
    </main>
  );
} 