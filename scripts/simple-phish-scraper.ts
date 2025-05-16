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

const YEARS = Array.from({ length: 2025 - 1983 + 1 }, (_, i) => 1983 + i);
const OUTPUT_DIR = path.join(process.cwd(), 'data');
const CSV_FILE = path.join(OUTPUT_DIR, 'phish_shows.csv');
const JSON_FILE = path.join(OUTPUT_DIR, 'phish_shows.json');

// Wait between requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches shows for a specific year from Phish.net
 */
async function fetchShowsForYear(year: number): Promise<PhishShow[]> {
  console.log(`Fetching shows for ${year}...`);
  
  try {
    const response = await axios.get(`https://phish.net/setlists/?year=${year}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch shows for ${year}: ${response.status}`);
    }
    
    const $ = cheerio.load(response.data);
    const shows: PhishShow[] = [];
    
    // Find all show entries
    $('.setlist-block').each((_, block) => {
      try {
        // Get the date
        const dateElement = $(block).find('.setlist-date');
        const dateText = dateElement.text().trim();
        
        // Get the venue
        const venueElement = $(block).find('.setlist-venue');
        const venueText = venueElement.text().trim();
        
        // Get the location
        const locationElement = $(block).find('.setlist-location');
        const locationText = locationElement.text().trim();
        
        // Get the link
        const linkElement = dateElement.find('a');
        const linkHref = linkElement.attr('href');
        const netLink = linkHref ? `https://phish.net${linkHref}` : '';
        
        if (dateText) {
          shows.push({
            year,
            date: dateText,
            venue: venueText || 'Unknown Venue',
            city_state: locationText || 'Unknown Location',
            net_link: netLink
          });
        }
      } catch (error) {
        console.error(`Error processing show for ${year}:`, error);
      }
    });
    
    console.log(`Found ${shows.length} shows for ${year}`);
    return shows;
  } catch (error) {
    console.error(`Error fetching shows for ${year}:`, error);
    return [];
  }
}

/**
 * Main function to fetch all shows
 */
async function main() {
  console.log('Starting Phish shows scraper...');
  
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    const allShows: PhishShow[] = [];
    const currentYear = new Date().getFullYear();
    
    // Process each year
    for (const year of YEARS) {
      // Skip years beyond next year
      if (year > currentYear + 1) {
        console.log(`Skipping future year ${year}`);
        continue;
      }
      
      const shows = await fetchShowsForYear(year);
      allShows.push(...shows);
      
      // Save after each year
      if (shows.length > 0) {
        console.log(`Saving progress (${allShows.length} total shows)...`);
        await saveToFiles(allShows);
      }
      
      // Wait between requests to avoid rate limiting
      console.log('Waiting 5 seconds before next request...');
      await delay(5000);
    }
    
    console.log(`Scraping completed. Total shows: ${allShows.length}`);
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

/**
 * Save shows to CSV and JSON files
 */
async function saveToFiles(shows: PhishShow[]) {
  try {
    // Sort shows by date
    shows.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      
      // Try to parse dates for same-year comparison
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateA.getTime() - dateB.getTime();
        }
      } catch (e) {
        // Fall back to string comparison
      }
      return a.date.localeCompare(b.date);
    });
    
    // Save to CSV
    const csvWriter = createObjectCsvWriter({
      path: CSV_FILE,
      header: [
        { id: 'year', title: 'year' },
        { id: 'date', title: 'date' },
        { id: 'venue', title: 'venue' },
        { id: 'city_state', title: 'city_state' },
        { id: 'net_link', title: 'net_link' }
      ]
    });
    
    await csvWriter.writeRecords(shows);
    console.log(`CSV file saved to ${CSV_FILE}`);
    
    // Save to JSON
    await fs.writeFile(
      JSON_FILE,
      JSON.stringify({ shows }, null, 2)
    );
    console.log(`JSON file saved to ${JSON_FILE}`);
    
  } catch (error) {
    console.error('Error saving files:', error);
  }
}

// Run the scraper
main(); 