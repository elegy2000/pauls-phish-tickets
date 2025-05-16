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

// Configuration settings
const CONFIG = {
  BASE_URL: 'https://phish.net',
  USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  REQUEST_DELAY_MS: 5000, // 5 seconds between requests to avoid rate limiting
  RETRY_DELAY_MS: 10000, // 10 seconds before retrying after an error
  MAX_RETRIES: 3, // Maximum number of retry attempts
  START_YEAR: 1983,
  END_YEAR: 2025,
  DATA_DIR: path.join(process.cwd(), 'data'),
  CSV_FILENAME: 'phish_tours_comprehensive.csv',
  JSON_FILENAME: 'phish_tours_comprehensive.json'
};

/**
 * Sleep for the specified number of milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get array of years to scrape
 */
async function getAllYears(): Promise<number[]> {
  return Array.from(
    { length: CONFIG.END_YEAR - CONFIG.START_YEAR + 1 }, 
    (_, i) => CONFIG.START_YEAR + i
  );
}

/**
 * Fetch and parse shows for a specific year with retry mechanism
 */
async function getShowsForYear(year: number): Promise<PhishShow[]> {
  let retries = 0;
  
  while (retries <= CONFIG.MAX_RETRIES) {
    try {
      console.log(`Fetching shows for ${year}... (Attempt ${retries + 1})`);
      
      const url = `${CONFIG.BASE_URL}/setlists/phish-${year}.html`;
      console.log(`Accessing ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 30000 // 30 second timeout
      });
      
      // Only check for status code, don't validate response.data
      if (response.status !== 200) {
        throw new Error(`Invalid response status: ${response.status}`);
      }
      
      const shows: PhishShow[] = [];
      const $ = cheerio.load(response.data);
      
      // Get all show entries - check different possible selectors
      const selectors = [
        '.setlist-header', 
        '.setlist',
        '.setlist-container'
      ];
      
      let foundElements = false;
      
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          foundElements = true;
          console.log(`Found ${elements.length} elements with selector '${selector}'`);
          
          elements.each((_, element) => {
            try {
              // Try different selectors for date
              let dateLink = $(element).find('a.setlist-date');
              if (!dateLink.length) {
                dateLink = $(element).find('a:contains("' + year + '")');
              }
              
              if (!dateLink.length) {
                return;
              }
              
              const dateText = dateLink.text().trim();
              const linkHref = dateLink.attr('href');
              const netLink = linkHref ? `${CONFIG.BASE_URL}${linkHref}` : '';
              
              // Try different selectors for venue
              let venueText = '';
              const venueSelectors = ['.setlist-venue', '.venue', 'h4'];
              
              for (const venueSelector of venueSelectors) {
                const venueElement = $(element).find(venueSelector);
                if (venueElement.length) {
                  venueText = venueElement.text().trim();
                  break;
                }
              }
              
              // Try different selectors for location
              let locationText = '';
              const locationSelectors = ['.setlist-location', '.location', 'h5', 'span.location'];
              
              for (const locationSelector of locationSelectors) {
                const locationElement = $(element).find(locationSelector);
                if (locationElement.length) {
                  locationText = locationElement.text().trim();
                  break;
                }
              }
              
              // Only add if we have at least the basics
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
              console.error(`Error processing show element: ${error}`);
            }
          });
          
          // If we found elements with this selector, no need to try others
          break;
        }
      }
      
      if (!foundElements) {
        // If no elements found with specific selectors, try to extract any links containing the year
        console.log(`No elements found with specific selectors, trying generic approach`);
        
        $('a').each((_, link) => {
          const href = $(link).attr('href');
          const text = $(link).text().trim();
          
          // Look for links that might point to show pages
          if (href && href.includes(`/setlists/phish-${year}`) && text.includes(year.toString())) {
            shows.push({
              year,
              date: text,
              venue: 'Unknown Venue',
              city_state: 'Unknown Location',
              net_link: `${CONFIG.BASE_URL}${href}`
            });
          }
        });
      }
      
      console.log(`Found ${shows.length} shows for ${year}`);
      
      // If we have shows, return them
      if (shows.length > 0) {
        return shows;
      }
      
      // If no shows found but the request was successful, return empty array (no need to retry)
      if (foundElements || retries === CONFIG.MAX_RETRIES) {
        console.log(`No shows found for ${year}, but parsing completed. Continuing.`);
        return [];
      }
      
      // Otherwise try another approach with retry
      throw new Error("Couldn't extract show data with any selector");
      
    } catch (error) {
      retries++;
      console.error(`Error fetching shows for ${year} (Attempt ${retries}/${CONFIG.MAX_RETRIES}):`, error);
      
      if (retries <= CONFIG.MAX_RETRIES) {
        // Exponential backoff
        const delayMs = CONFIG.RETRY_DELAY_MS * Math.pow(1.5, retries - 1);
        console.log(`Retrying in ${Math.ceil(delayMs / 1000)} seconds...`);
        await sleep(delayMs);
      } else {
        console.error(`Failed to fetch shows for ${year} after ${CONFIG.MAX_RETRIES} attempts`);
        return [];
      }
    }
  }
  
  return []; // Return empty array if all retries failed
}

/**
 * Save shows to CSV and JSON files
 */
async function saveShowsToFiles(shows: PhishShow[]): Promise<void> {
  try {
    // Create the data directory if it doesn't exist
    await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
    
    // Sort the shows by date
    shows.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      
      // Parse dates for same-year comparison (handle potential parsing errors)
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateA.getTime() - dateB.getTime();
        }
      } catch (error) {
        // Fall back to string comparison if date parsing fails
      }
      return a.date.localeCompare(b.date);
    });
    
    // Write to CSV
    if (shows.length > 0) {
      // Save a backup of the old file if it exists
      const csvPath = path.join(CONFIG.DATA_DIR, CONFIG.CSV_FILENAME);
      const jsonPath = path.join(CONFIG.DATA_DIR, CONFIG.JSON_FILENAME);
      
      try {
        const fileExists = await fs.access(csvPath).then(() => true).catch(() => false);
        if (fileExists) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
          await fs.copyFile(csvPath, path.join(CONFIG.DATA_DIR, `${CONFIG.CSV_FILENAME}.${timestamp}.bak`));
        }
      } catch (err) {
        // Ignore backup errors
      }
      
      // Write CSV file
      const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: [
          { id: 'year', title: 'year' },
          { id: 'date', title: 'date' },
          { id: 'venue', title: 'venue' },
          { id: 'city_state', title: 'city_state' },
          { id: 'net_link', title: 'net_link' }
        ]
      });
      
      await csvWriter.writeRecords(shows);
      console.log(`CSV file created at ${csvPath} with ${shows.length} shows`);
      
      // Write JSON file
      await fs.writeFile(
        jsonPath,
        JSON.stringify({ shows: shows }, null, 2)
      );
      console.log(`JSON file created at ${jsonPath} with ${shows.length} shows`);
    } else {
      console.log("No shows found to save.");
    }
  } catch (error) {
    console.error('Error saving shows to files:', error);
    throw error;
  }
}

/**
 * Check if we can resume from a partially completed run
 */
async function checkForResumableData(): Promise<PhishShow[]> {
  const jsonPath = path.join(CONFIG.DATA_DIR, CONFIG.JSON_FILENAME);
  
  try {
    const fileExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    if (fileExists) {
      const jsonData = await fs.readFile(jsonPath, 'utf8');
      const data = JSON.parse(jsonData);
      
      if (data && data.shows && Array.isArray(data.shows) && data.shows.length > 0) {
        console.log(`Found existing data with ${data.shows.length} shows. Resuming from there.`);
        return data.shows;
      }
    }
  } catch (error) {
    console.error('Error checking for resumable data:', error);
  }
  
  return [];
}

/**
 * Main function to run the scraper
 */
async function main() {
  try {
    console.log("Starting comprehensive Phish.net data scraper...");
    
    // Check if we can resume from a previous run
    let allShows = await checkForResumableData();
    const processedYears = new Set(allShows.map(show => show.year));
    
    // Get years to process
    const years = await getAllYears();
    console.log(`Will process years from ${CONFIG.START_YEAR} to ${CONFIG.END_YEAR}`);
    
    // Filter to only years we haven't processed yet
    const yearsToProcess = years.filter(year => !processedYears.has(year));
    console.log(`Found ${allShows.length} existing shows. Need to process ${yearsToProcess.length} more years.`);
    
    // Process each year
    for (const year of yearsToProcess) {
      // Only process years up to current year + 1 (for announced future shows)
      const currentYear = new Date().getFullYear();
      if (year <= currentYear + 1) {
        const shows = await getShowsForYear(year);
        if (shows.length > 0) {
          allShows.push(...shows);
          console.log(`Added ${shows.length} shows from ${year}. Total so far: ${allShows.length}`);
          
          // Save progress after each year
          await saveShowsToFiles(allShows);
          
          // Add a delay to avoid rate limiting
          console.log(`Waiting ${CONFIG.REQUEST_DELAY_MS / 1000} seconds before next request...`);
          await sleep(CONFIG.REQUEST_DELAY_MS);
        } else {
          console.warn(`No shows found for year ${year}`);
        }
      } else {
        console.log(`Skipping future year ${year} (beyond ${currentYear + 1})`);
      }
    }
    
    // Final save to ensure all data is written
    if (allShows.length > 0) {
      await saveShowsToFiles(allShows);
      console.log(`Scrape completed successfully! Total shows: ${allShows.length}`);
    } else {
      console.error("No shows were found across all years!");
    }
    
  } catch (error) {
    console.error('Fatal error in comprehensive scraper:', error);
  }
}

// Start the scraper
main(); 