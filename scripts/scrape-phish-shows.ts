import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createObjectCsvWriter } from 'csv-writer';

interface PhishShow {
  year: number;
  date: string;
  venue: string;
  city_state: string;
  net_link: string;
}

async function scrapePhishSetlists(): Promise<PhishShow[]> {
  try {
    console.log('Scraping Phish.net setlists...');
    const allShows: PhishShow[] = [];
    
    // Start with the first page
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages && page <= 20) { // Limit to 20 pages to be safe
      console.log(`Scraping page ${page}...`);
      
      const response = await axios.get(`https://phish.net/setlists/?page=${page}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const showRows = $('.setlist-header');
      
      if (showRows.length === 0) {
        hasMorePages = false;
        break;
      }
      
      showRows.each((_, element) => {
        try {
          // Extract date and link
          const dateLink = $(element).find('a').first();
          const dateText = dateLink.text().trim();
          const netLink = `https://phish.net${dateLink.attr('href')}`;
          
          // Extract venue
          const venueElement = $(element).find('.setlist-venue');
          const venue = venueElement.text().trim();
          
          // Extract location
          const locationElement = $(element).find('.setlist-location');
          const location = locationElement.text().trim();
          
          // Extract year from date
          const yearMatch = dateText.match(/\d{4}$/);
          const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
          
          if (year && dateText && venue) {
            allShows.push({
              year,
              date: dateText,
              venue,
              city_state: location,
              net_link: netLink
            });
          }
        } catch (error) {
          console.error('Error parsing show:', error);
        }
      });
      
      console.log(`Found ${allShows.length} shows so far`);
      
      // Check if there's a next page
      const nextPageLink = $('.page-item.active').next().find('a');
      if (!nextPageLink.length) {
        hasMorePages = false;
      }
      
      page++;
      
      // Add a delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return allShows;
    
  } catch (error) {
    console.error('Error scraping Phish.net setlists:', error);
    return [];
  }
}

async function scrapeShowsByYear(): Promise<PhishShow[]> {
  try {
    console.log('Scraping Phish shows by year...');
    const allShows: PhishShow[] = [];
    
    // Years to scrape
    const years = Array.from({ length: 42 }, (_, i) => 1983 + i); // 1983 to 2024
    
    for (const year of years) {
      console.log(`Scraping shows from ${year}...`);
      
      const response = await axios.get(`https://phish.net/setlists/phish-${year}.html`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const showRows = $('.setlist-header');
      
      showRows.each((_, element) => {
        try {
          // Extract date and link
          const dateLink = $(element).find('a').first();
          const dateText = dateLink.text().trim();
          const netLink = `https://phish.net${dateLink.attr('href')}`;
          
          // Extract venue
          const venueElement = $(element).find('.setlist-venue');
          const venue = venueElement.text().trim();
          
          // Extract location
          const locationElement = $(element).find('.setlist-location');
          const location = locationElement.text().trim();
          
          allShows.push({
            year,
            date: dateText,
            venue,
            city_state: location,
            net_link: netLink
          });
        } catch (error) {
          console.error(`Error parsing show from ${year}:`, error);
        }
      });
      
      console.log(`Found ${allShows.length} shows so far`);
      
      // Add a delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return allShows;
    
  } catch (error) {
    console.error('Error scraping shows by year:', error);
    return [];
  }
}

async function main() {
  try {
    // Try both methods and use the one that works better
    const setlistShows = await scrapePhishSetlists();
    const yearShows = await scrapeShowsByYear();
    
    // Use the method that found more shows
    const shows = setlistShows.length > yearShows.length ? setlistShows : yearShows;
    console.log(`Found ${shows.length} shows in total`);
    
    if (shows.length > 0) {
      // Create the data directory if it doesn't exist
      const dataDir = path.join(process.cwd(), 'data');
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (err) {
        console.log('Data directory already exists');
      }
      
      // Write shows to CSV
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
      
      await csvWriter.writeRecords(shows);
      console.log(`CSV file created with ${shows.length} shows`);
      
      // Write shows to JSON
      const jsonPath = path.join(dataDir, 'phish_tours.json');
      await fs.writeFile(jsonPath, JSON.stringify({ shows }, null, 2));
      console.log(`JSON file created at ${jsonPath}`);
    } else {
      console.log('No shows found, no files created');
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main(); 