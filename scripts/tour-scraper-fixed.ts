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
    
    // Find all Phish tour rows in the first table
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
          const showCount = parseInt(showCountText.split(' ')[0], 10) || 0;
          
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
    
    // Find all links in the main content box
    $('.tpcmainbox a').each((_, link) => {
      const href = $(link).attr('href') || '';
      
      // Only process setlist links
      if (href.includes('/setlists/phish-') || href.includes('/setlists/trey-') || 
          href.includes('/setlists/mike-') || href.includes('/setlists/page-') || 
          href.includes('/setlists/fish-')) {
        
        try {
          // Get the entire text from the link and following text
          let linkContent = $(link).parent().text().trim();
          
          // Extract date from the URL
          const dateMatch = href.match(/setlists\/.*?-([a-z]+-\d{2}-\d{4})-/i);
          const dateFromUrl = dateMatch ? dateMatch[1] : '';
          
          // Convert date format (e.g., "december-02-1983" to "1983-12-02")
          let formattedDate = '';
          if (dateFromUrl) {
            const parts = dateFromUrl.split('-');
            if (parts.length === 3) {
              const month = new Date(Date.parse(`${parts[0]} 1, 2000`)).getMonth() + 1;
              formattedDate = `${parts[2]}-${month.toString().padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
          }
          
          // Get the full text node content
          const fullHtmlLine = $(link).parent().html() || '';
          
          // Extract venue - it's the text in the link
          const venue = $(link).text().trim().split('\n')[0];
          
          // Extract location - it's after the link
          const locationMatch = fullHtmlLine.match(/<\/a><\/br>\s*(.*?)(?:<\/br>|$)/);
          const location = locationMatch ? locationMatch[1].trim() : '';
          
          if (venue) {
            shows.push({
              year: tourYear,
              tour: tour.name,
              date: formattedDate,
              venue: venue,
              city_state: location,
              net_link: `${BASE_URL}${href}`
            });
          }
        } catch (error) {
          console.error(`Error processing show link for tour ${tour.id}:`, error);
        }
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
      
      // Compare dates directly if in YYYY-MM-DD format
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
    
    // Check if we already have a JSON file to resume from
    let allShows: PhishShow[] = [];
    try {
      const existingData = await fs.readFile(JSON_FILE, 'utf8');
      const parsed = JSON.parse(existingData);
      if (parsed && parsed.shows && Array.isArray(parsed.shows)) {
        allShows = parsed.shows;
        console.log(`Resuming from existing data with ${allShows.length} shows`);
      }
    } catch (e) {
      console.log('No existing data found, starting fresh');
    }
    
    // Get list of tours we've already processed
    const processedTours = new Set(allShows.map(show => show.tour));
    
    // Fetch all tours
    const tours = await fetchTourList();
    if (tours.length === 0) {
      throw new Error('No tours found. Cannot continue.');
    }
    
    // Filter to only tours we haven't processed yet
    const toursToProcess = tours.filter(tour => !processedTours.has(tour.name));
    
    console.log(`Found ${tours.length} total tours. Need to process ${toursToProcess.length} more.`);
    
    // Process each tour and fetch its shows
    for (const tour of toursToProcess) {
      if (tour.showCount > 0) {
        const shows = await fetchShowsForTour(tour);
        if (shows.length > 0) {
          allShows.push(...shows);
          
          // Save progress after each tour
          console.log(`Saving progress (${allShows.length} total shows)...`);
          await saveToFiles(allShows);
        }
        
        // Add a delay between tours to avoid rate limiting
        console.log('Waiting 3 seconds before next tour...');
        await delay(3000);
      } else {
        console.log(`Skipping tour "${tour.name}" as it has 0 shows`);
      }
    }
    
    console.log(`Scraping completed! Total shows: ${allShows.length}`);
    console.log(`Data saved to ${CSV_FILE} and ${JSON_FILE}`);
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Run the scraper
main(); 