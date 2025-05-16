import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import { createObjectCsvWriter } from 'csv-writer';

// Load environment variables
dotenv.config();

const PHISHNET_API_BASE = 'https://api.phish.net/v5';
const API_KEY = process.env.PHISHNET_API_KEY;

if (!API_KEY) {
  console.error('PHISHNET_API_KEY environment variable is not set');
  process.exit(1);
}

console.log('API Key exists:', API_KEY ? 'Yes' : 'No');

interface PhishNetShow {
  showid: string;
  showdate: string;
  venuename: string;
  city: string;
  state: string;
  country: string;
  tour?: string;
  tourname?: string;
}

interface TourInfo {
  id: string;
  name: string;
  when: string;
  numShows: number;
}

async function makeRequest(method: string, params: Record<string, string> = {}) {
  try {
    const url = `${PHISHNET_API_BASE}/${method}`;
    console.log(`Making request to ${url}`);
    
    const response = await axios.get(url, {
      params: {
        apikey: API_KEY,
        ...params,
      },
      headers: {
        'User-Agent': 'PaulsTicketSite/1.0',
        'Accept': 'application/json',
      }
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('PhishNet API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error('PhishNet API Error:', error);
    }
    throw error;
  }
}

async function fetchAllTours(): Promise<TourInfo[]> {
  // First fetch the tour list
  console.log('Fetching list of all tours...');
  
  try {
    // Fetching from HTML since the API doesn't have a direct endpoint for all tours
    const response = await axios.get('https://phish.net/tour', {
      headers: {
        'User-Agent': 'PaulsTicketSite/1.0',
      }
    });
    
    const html = response.data;
    const tours: TourInfo[] = [];
    
    // Parse the Phish tour table - updated regex pattern
    const phishSectionRegex = /<h3>Phish<\/h3>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i;
    const phishSection = phishSectionRegex.exec(html)?.[1] || '';
    
    console.log('Found Phish section:', phishSection.length > 0);
    
    // Extract tour information from the table rows
    const tourRegex = /<tr[^>]*?>[\s\S]*?<a href="\/tour\/(\d+)[^"]*"[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>(\d+) shows<\/td>/g;
    let match;
    
    while ((match = tourRegex.exec(phishSection)) !== null) {
      const tourId = match[1];
      const tourName = match[2].trim();
      const when = match[3].trim();
      const numShows = parseInt(match[4], 10);
      
      console.log(`Found tour: ${tourName} (${tourId}) - ${when} - ${numShows} shows`);
      
      tours.push({
        id: tourId,
        name: tourName,
        when,
        numShows
      });
    }
    
    // If we didn't find tours with the specific pattern, try a more general approach
    if (tours.length === 0) {
      console.log('Trying alternative parsing method...');
      const allTourLinks = html.match(/<a href="\/tour\/(\d+)-[^"]*"[^>]*>[^<]+<\/a>/g) || [];
      
      for (const link of allTourLinks) {
        const idMatch = link.match(/\/tour\/(\d+)-/);
        const nameMatch = link.match(/>([^<]+)</);
        
        if (idMatch && nameMatch) {
          const tourId = idMatch[1];
          const tourName = nameMatch[1].trim();
          
          console.log(`Found tour (alt method): ${tourName} (${tourId})`);
          
          tours.push({
            id: tourId,
            name: tourName,
            when: 'Unknown',
            numShows: 0
          });
        }
      }
    }
    
    console.log(`Found ${tours.length} tours`);
    return tours;
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
}

async function fetchShowsForTour(tourId: string): Promise<PhishNetShow[]> {
  console.log(`Fetching shows for tour ID ${tourId}...`);
  
  try {
    // First try the API endpoint
    const data = await makeRequest(`shows/showtourid.json`, {
      tourid: tourId
    });
    
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log(`Found ${data.data.length} shows via API for tour ${tourId}`);
      return data.data;
    }
    
    // If API didn't return data, try scraping the tour page
    console.log(`No shows found via API for tour ${tourId}, trying to scrape the tour page...`);
    
    const response = await axios.get(`https://phish.net/tour/${tourId}-tour.html`, {
      headers: {
        'User-Agent': 'PaulsTicketSite/1.0',
      }
    });
    
    const html = response.data;
    const shows: PhishNetShow[] = [];
    
    // Parse shows from the table rows
    const showRegex = /<tr[^>]*?>[\s\S]*?<a href="\/setlists\/phish-(\d{4}-\d{2}-\d{2})[^"]*"[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/g;
    let match;
    
    while ((match = showRegex.exec(html)) !== null) {
      const dateStr = match[1];
      const venue = match[2].trim();
      const location = match[3].trim();
      
      // Split location into city and state if possible
      const locationParts = location.split(', ');
      const city = locationParts[0] || '';
      const state = locationParts.length > 1 ? locationParts[1] : '';
      
      shows.push({
        showid: `${dateStr}`,
        showdate: dateStr,
        venuename: venue,
        city,
        state,
        country: 'USA',
        tour: tourId
      });
    }
    
    console.log(`Found ${shows.length} shows via scraping for tour ${tourId}`);
    return shows;
  } catch (error) {
    console.error(`Error fetching shows for tour ${tourId}:`, error);
    return [];
  }
}

function formatDate(dateStr: string): string {
  try {
    // Input format: YYYY-MM-DD
    if (!dateStr) return 'Unknown Date';
    
    const [year, month, day] = dateStr.split('-').map(Number);
    
    if (!year || !month || !day) {
      return dateStr; // Return original if we can't parse
    }
    
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error(`Error formatting date ${dateStr}:`, error);
    return dateStr;
  }
}

function getYear(dateStr: string): number {
  try {
    if (!dateStr) return 0;
    
    const [yearStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    
    return isNaN(year) ? 0 : year;
  } catch (error) {
    console.error(`Error getting year from date ${dateStr}:`, error);
    return 0;
  }
}

async function getHardcodedTours(): Promise<TourInfo[]> {
  // Use the tour IDs from the Phish.net website
  return [
    { id: "1", name: "1983 Tour", when: "1983", numShows: 2 },
    { id: "2", name: "1984 Tour", when: "1984", numShows: 3 },
    { id: "3", name: "1985 Tour", when: "1985", numShows: 28 },
    { id: "4", name: "1986 Tour", when: "1986", numShows: 19 },
    { id: "5", name: "1987 Tour", when: "1987", numShows: 42 },
    { id: "6", name: "1988 Tour", when: "1988", numShows: 95 },
    { id: "7", name: "1989 Tour", when: "1989", numShows: 128 },
    { id: "60", name: "1990 Tour", when: "1990", numShows: 147 },
    { id: "10", name: "1991 Fall Tour", when: "1991 Fall", numShows: 49 },
    { id: "9", name: "1991 Giant Country Horns Summer Tour", when: "1991 Summer", numShows: 14 },
    { id: "8", name: "1991 Winter/Spring Tour", when: "1991 Winter", numShows: 63 },
    { id: "18", name: "1992 Fall Tour", when: "1992 Fall", numShows: 21 },
    { id: "19", name: "1992 NYE Run", when: "1992 NYE", numShows: 4 },
    { id: "11", name: "1992 Spring Tour", when: "1992 Spring", numShows: 54 },
    { id: "12", name: "1992 Summer European Tour", when: "1992 Summer", numShows: 8 },
    { id: "17", name: "1992 Summer U.S. Tour", when: "1992 Summer", numShows: 34 },
    { id: "22", name: "1993 NYE Run", when: "1993 NYE", numShows: 4 },
    { id: "21", name: "1993 Summer Tour", when: "1993 Summer", numShows: 33 },
    { id: "20", name: "1993 Winter/Spring Tour", when: "1993 Winter", numShows: 71 },
    { id: "25", name: "1994 Fall Tour", when: "1994 Fall", numShows: 46 },
    { id: "26", name: "1994 NYE Run", when: "1994 NYE", numShows: 4 },
    { id: "23", name: "1994 Spring Tour", when: "1994 Spring", numShows: 44 },
    { id: "24", name: "1994 Summer Tour", when: "1994 Summer", numShows: 29 },
    { id: "28", name: "1995 Fall Tour", when: "1995 Fall", numShows: 54 },
    { id: "29", name: "1995 NYE Run", when: "1995 NYE", numShows: 4 },
    { id: "27", name: "1995 Summer Tour", when: "1995 Summer", numShows: 22 },
    { id: "32", name: "1996 Fall Tour", when: "1996 Fall", numShows: 35 },
    { id: "33", name: "1996 NYE Run", when: "1996 NYE", numShows: 4 },
    { id: "30", name: "1996 Summer European Tour", when: "1996 Summer", numShows: 18 },
    { id: "31", name: "1996 Summer U.S. Tour", when: "1996 Summer", numShows: 12 },
    { id: "37", name: "1997 Fall Tour (a.k.a. Phish Destroys America)", when: "1997 Fall", numShows: 21 },
    { id: "38", name: "1997 NYE Run", when: "1997 NYE", numShows: 4 },
    { id: "35", name: "1997 Summer European Tour", when: "1997 Summer", numShows: 19 },
    { id: "36", name: "1997 Summer U.S. Tour", when: "1997 Summer", numShows: 19 },
    { id: "34", name: "1997 Winter European Tour", when: "1997 Winter", numShows: 14 },
    { id: "42", name: "1998 Fall Tour", when: "1998 Fall", numShows: 22 },
    { id: "39", name: "1998 Island Tour", when: "1998 Island", numShows: 4 }
    // Add more tour IDs as needed
  ];
}

async function fetchShowsByYear(year: string): Promise<PhishNetShow[]> {
  console.log(`Fetching shows for year ${year}...`);
  
  try {
    const data = await makeRequest(`shows/query.json`, {
      year
    });
    
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      console.log(`Found ${data.data.length} shows via API for year ${year}`);
      return data.data;
    }
    
    // If API didn't return data, try scraping
    console.log(`No shows found via API for year ${year}, trying alternative method...`);
    
    // Try to get shows for each day of the year
    const shows: PhishNetShow[] = [];
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      try {
        const showData = await makeRequest(`shows/showdate.json`, {
          showdate: dateStr
        });
        
        if (showData && showData.data && Array.isArray(showData.data) && showData.data.length > 0) {
          console.log(`Found ${showData.data.length} shows for date ${dateStr}`);
          shows.push(...showData.data);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error fetching shows for date ${dateStr}:`, error);
      }
    }
    
    console.log(`Found ${shows.length} shows via date-by-date method for year ${year}`);
    return shows;
  } catch (error) {
    console.error(`Error fetching shows for year ${year}:`, error);
    return [];
  }
}

// Simple approach - fetch show data for specific years with one API call per year
async function fetchPhishData() {
  try {
    const allShows: any[] = [];
    // Focus on a smaller range of years to test
    const years = [1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 
                  1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005,
                  2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
                  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    
    for (const year of years) {
      console.log(`Processing year ${year}...`);
      
      try {
        // Make one API call per year to get all shows
        const response = await axios.get(`${PHISHNET_API_BASE}/shows/query.json`, {
          params: {
            apikey: API_KEY,
            year: year.toString()
          },
          headers: {
            'User-Agent': 'PaulsTicketSite/1.0',
          }
        });
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          const shows = response.data.data;
          console.log(`Found ${shows.length} shows for ${year}`);
          
          // Process each show
          const processedShows = shows.map((show: PhishNetShow) => ({
            year: new Date(show.showdate).getFullYear(),
            date: new Date(show.showdate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            venue: show.venuename,
            city_state: show.city && show.state ? `${show.city}, ${show.state}` : (show.city || 'Unknown'),
            net_link: `https://phish.net/setlists/?d=${show.showdate}`
          }));
          
          allShows.push(...processedShows);
        } else {
          console.log(`No shows found for ${year}`);
        }
      } catch (error) {
        console.error(`Error fetching data for ${year}:`, error);
      }
      
      // Add delay between years to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Write the data to CSV
    if (allShows.length > 0) {
      const csvWriter = createObjectCsvWriter({
        path: path.join(process.cwd(), 'data', 'phish_tours.csv'),
        header: [
          { id: 'year', title: 'year' },
          { id: 'date', title: 'date' },
          { id: 'venue', title: 'venue' },
          { id: 'city_state', title: 'city_state' },
          { id: 'net_link', title: 'net_link' }
        ]
      });
      
      await csvWriter.writeRecords(allShows);
      console.log(`Successfully wrote ${allShows.length} shows to CSV`);
      
      // Also create a JSON file
      await fs.writeFile(
        path.join(process.cwd(), 'data', 'phish_tours.json'),
        JSON.stringify({ shows: allShows }, null, 2)
      );
      console.log('JSON file also created');
    } else {
      console.log('No shows found to write to CSV');
    }
  } catch (error) {
    console.error('Error in fetchPhishData:', error);
  }
}

// Run the script
fetchPhishData(); 