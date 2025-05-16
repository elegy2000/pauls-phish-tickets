import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import { createObjectCsvWriter } from 'csv-writer';

// Load environment variables
dotenv.config();

const API_KEY = process.env.PHISHNET_API_KEY;
console.log('API Key exists:', API_KEY ? 'Yes' : 'No');

interface PhishNetShow {
  showid: string;
  showdate: string;
  venuename: string;
  location: string;
  setlistnotes?: string;
  url: string;
}

async function fetchPhishShows() {
  try {
    console.log('Fetching all Phish shows...');
    
    // Use the "all" endpoint which returns data for all shows
    const response = await axios.get('https://api.phish.net/v5/shows/all.json', {
      params: {
        apikey: API_KEY
      },
      headers: {
        'User-Agent': 'PaulsTicketSite/1.0',
      }
    });
    
    if (response.data && !response.data.error && response.data.data) {
      const shows = response.data.data;
      console.log(`Found ${shows.length} shows in total`);
      
      // Process the shows into the required format
      const processedShows = shows.map((show: any) => {
        const date = new Date(show.showdate);
        
        return {
          year: date.getFullYear(),
          date: date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }),
          venue: show.venue,
          city_state: show.location || 'Unknown',
          net_link: show.url || `https://phish.net/setlists/?d=${show.showdate}`
        };
      });
      
      // Create the data directory if it doesn't exist
      const dataDir = path.join(process.cwd(), 'data');
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (err) {
        console.log('Data directory already exists');
      }
      
      // Write to CSV
      const csvWriter = createObjectCsvWriter({
        path: path.join(dataDir, 'phish_tours.csv'),
        header: [
          { id: 'year', title: 'year' },
          { id: 'date', title: 'date' },
          { id: 'venue', title: 'venue' },
          { id: 'city_state', title: 'city_state' },
          { id: 'net_link', title: 'net_link' }
        ]
      });
      
      await csvWriter.writeRecords(processedShows);
      console.log(`Successfully wrote ${processedShows.length} shows to CSV`);
      
      // Also create a JSON file
      await fs.writeFile(
        path.join(dataDir, 'phish_tours.json'),
        JSON.stringify({ shows: processedShows }, null, 2)
      );
      console.log('JSON file also created');
      
      return processedShows.length;
    } else {
      console.error('API error:', response.data.error_message || 'Unknown error');
      return 0;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } else {
      console.error('Error fetching Phish shows:', error);
    }
    return 0;
  }
}

// Run the script
fetchPhishShows().then(count => {
  if (count > 0) {
    console.log(`Successfully processed ${count} shows`);
  } else {
    console.log('No shows were processed');
  }
}); 