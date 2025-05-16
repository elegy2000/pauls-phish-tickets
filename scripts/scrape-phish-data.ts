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

async function scrapePhishTourData(): Promise<PhishShow[]> {
  try {
    console.log('Scraping Phish.net for tour data...');
    const allShows: PhishShow[] = [];
    
    // Get the list of tour years
    const tourResponse = await axios.get('https://phish.net/tour', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(tourResponse.data);
    const tourLinks: string[] = [];
    
    // Extract tour links from the page
    $('a[href^="/tour/"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('-tour.html') && !tourLinks.includes(href)) {
        tourLinks.push(href);
      }
    });
    
    console.log(`Found ${tourLinks.length} tour links`);
    
    // Process each tour page
    for (let i = 0; i < tourLinks.length; i++) {
      const tourLink = tourLinks[i];
      console.log(`Processing tour ${i + 1}/${tourLinks.length}: ${tourLink}`);
      
      try {
        const tourPageUrl = `https://phish.net${tourLink}`;
        const tourPageResponse = await axios.get(tourPageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
          }
        });
        
        const tourPage$ = cheerio.load(tourPageResponse.data);
        
        // Extract show information from the tour page table
        tourPage$('table.setlist-table tr').each((_, row) => {
          const cells = tourPage$(row).find('td');
          
          if (cells.length >= 3) {
            const dateLink = tourPage$(cells[0]).find('a');
            const dateText = dateLink.text().trim();
            const netLink = `https://phish.net${dateLink.attr('href')}`;
            
            const venue = tourPage$(cells[1]).text().trim();
            const location = tourPage$(cells[2]).text().trim();
            
            // Extract year from the date or tour name
            let year = 0;
            const yearMatch = tourLink.match(/(\d{4})-tour/);
            if (yearMatch) {
              year = parseInt(yearMatch[1], 10);
            } else {
              const dateYearMatch = dateText.match(/\d{4}$/);
              if (dateYearMatch) {
                year = parseInt(dateYearMatch[0], 10);
              }
            }
            
            if (year && dateText && venue) {
              allShows.push({
                year,
                date: dateText,
                venue,
                city_state: location,
                net_link: netLink
              });
            }
          }
        });
        
        console.log(`Found ${allShows.length} shows so far`);
        
        // Add a delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing tour ${tourLink}:`, error);
      }
    }
    
    return allShows;
    
  } catch (error) {
    console.error('Error scraping Phish.net:', error);
    return [];
  }
}

async function main() {
  try {
    const shows = await scrapePhishTourData();
    console.log(`Scraped ${shows.length} shows in total`);
    
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