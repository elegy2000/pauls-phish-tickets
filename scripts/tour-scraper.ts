import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createObjectCsvWriter } from 'csv-writer';

interface PhishShow {
  year: number;
  tour: string;
  date: string;
  venue: string;
  city_state: string;
  net_link: string;
}

interface TourInfo {
  id: string;
  name: string;
  url: string;
  year: string;
  showCount: number;
}

const BASE_URL = 'https://phish.net';
const TOUR_URL = `${BASE_URL}/tour`;
const OUTPUT_DIR = path.join(process.cwd(), 'data');
const CSV_FILE = path.join(OUTPUT_DIR, 'phish_tours_complete.csv');
const JSON_FILE = path.join(OUTPUT_DIR, 'phish_tours_complete.json');

// Wait between requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch all tour information from the main tour page
 */
async function fetchTourList(): Promise<TourInfo[]> {
  console.log(`Fetching tour list from ${TOUR_URL}...`);
  
  try {
    const response = await axios.get(TOUR_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch tour list: ${response.status}`);
    }
    
    const $ = cheerio.load(response.data);
    const tours: TourInfo[] = [];
    
    // Find all Phish tour rows
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      
      if (cells.length === 3) {
        const nameCell = $(cells[0]);
        const linkElement = nameCell.find('a');
        const href = linkElement.attr('href') || '';
        
        // Only process if it has a tour URL
        if (href && href.includes('/tour/')) {
          const tourName = linkElement.text().trim();
          const yearText = $(cells[1]).text().trim();
          const showCountText = $(cells[2]).text().trim();
          const showCount = parseInt(showCountText.split(' ')[0], 10);
          
          // Extract ID from the URL
          const match = href.match(/\/tour\/(\d+)-/);
          const id = match ? match[1] : '';
          
          tours.push({
            id,
            name: tourName,
            url: `${BASE_URL}${href}`,
            year: yearText,
            showCount
          });
        }
      }
    });
    
    console.log(`Found ${tours.length} Phish tours`);
    return tours;
  } catch (error) {
    console.error('Error fetching tour list:', error);
    return [];
  }
}

/**
 * Fetch shows for a specific tour
 */
async function fetchShowsForTour(tour: TourInfo): Promise<PhishShow[]> {
  console.log(`Fetching ${tour.showCount} shows for "${tour.name}"...`);
  
  try {
    const response = await axios.get(tour.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch shows for tour ${tour.id}: ${response.status}`);
    }
    
    const $ = cheerio.load(response.data);
    const shows: PhishShow[] = [];
    
    // Parse the year from the tour name or year field
    let yearMatch = tour.year.match(/(\d{4})/);
    const tourYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;
    
    // Find all show entries in the tour page
    $('.setlist-block').each((_, block) => {
      try {
        // Get the date
        const dateElement = $(block).find('.setlist-date');
        const dateText = dateElement.text().trim();
        
        // Extract year from date if possible
        yearMatch = dateText.match(/\b(\d{4})\b/);
        const showYear = yearMatch ? parseInt(yearMatch[1], 10) : tourYear;
        
        // Get the venue
        const venueElement = $(block).find('.setlist-venue');
        const venueText = venueElement.text().trim();
        
        // Get the location
        const locationElement = $(block).find('.setlist-location');
        const locationText = locationElement.text().trim();
        
        // Get the link
        const linkElement = dateElement.find('a');
        const linkHref = linkElement.attr('href');
        const netLink = linkHref ? `${BASE_URL}${linkHref}` : '';
        
        if (dateText) {
          shows.push({
            year: showYear,
            tour: tour.name,
            date: dateText,
            venue: venueText || 'Unknown Venue',
            city_state: locationText || 'Unknown Location',
            net_link: netLink
          });
        }
      } catch (error) {
        console.error(`Error processing show for tour ${tour.id}:`, error);
      }
    });
    
    console.log(`Found ${shows.length} shows for "${tour.name}" (expected ${tour.showCount})`);
    return shows;
  } catch (error) {
    console.error(`Error fetching shows for tour ${tour.id}:`, error);
    return [];
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
        { id: 'tour', title: 'tour' },
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

/**
 * Main function to fetch all tours and their shows
 */
async function main() {
  try {
    console.log('Starting Phish tour scraper...');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Fetch all tours
    const tours = await fetchTourList();
    if (tours.length === 0) {
      throw new Error('No tours found. Cannot continue.');
    }
    
    // Calculate total expected shows
    const totalShows = tours.reduce((sum, tour) => sum + tour.showCount, 0);
    console.log(`Beginning to fetch approximately ${totalShows} shows across ${tours.length} tours`);
    
    const allShows: PhishShow[] = [];
    
    // Process each tour and fetch its shows
    for (const tour of tours) {
      if (tour.showCount > 0) {
        const shows = await fetchShowsForTour(tour);
        allShows.push(...shows);
        
        // Save progress after each tour
        if (shows.length > 0) {
          console.log(`Saving progress (${allShows.length}/${totalShows} total shows)...`);
          await saveToFiles(allShows);
        }
        
        // Add a delay between tours to avoid rate limiting
        console.log('Waiting 5 seconds before next tour...');
        await delay(5000);
      } else {
        console.log(`Skipping tour "${tour.name}" as it has 0 shows`);
      }
    }
    
    console.log(`Scraping completed. Total shows: ${allShows.length}/${totalShows}`);
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Run the scraper
main(); 