import * as fs from 'fs';
import * as path from 'path';
import { exportToCsv } from './csvUtils';

// Define the Ticket interface here since we can't import it in CommonJS
interface Ticket {
  year: number;
  date: string;
  venue: string;
  city_state: string;
  imageUrl: string;
  net_link: string;
}

// Function to fetch tour years from phish.net
async function fetchPhishTourYears(): Promise<number[]> {
  try {
    console.log('Fetching Phish tour years from phish.net...');
    const response = await fetch('https://phish.net/tour');
    const html = await response.text();
    
    // Extract years from the 'Phish' section
    const phishSectionRegex = /<h2>Phish<\/h2>([\s\S]*?)(?:<h2>|$)/;
    const phishSection = phishSectionRegex.exec(html)?.[1] || '';
    
    // Extract years from the links in the Phish section
    const yearLinkRegex = /<a href="\/tour\/(\d+)-.*?">(\d+) tour<\/a>/g;
    const years: number[] = [];
    let match;
    
    while ((match = yearLinkRegex.exec(phishSection)) !== null) {
      years.push(parseInt(match[2]));
    }
    
    console.log(`Found ${years.length} Phish tour years`);
    return years.sort();
  } catch (error) {
    console.error('Error fetching Phish tour years:', error);
    return [];
  }
}

// Function to fetch tour data for a specific year
async function fetchTourDataForYear(year: number): Promise<Ticket[]> {
  try {
    console.log(`Fetching tour data for ${year}...`);
    const response = await fetch(`https://phish.net/tour/${year}-tour.html`);
    const html = await response.text();
    
    // Extract tour data
    const tourDataRegex = /<tr[^>]*?>[\s\S]*?<a href="(\/setlists\/phish-(.*?)\.html)"[^>]*?>(.*?)<\/a>[\s\S]*?<td[^>]*?>(.*?)<\/td>[\s\S]*?<td[^>]*?>(.*?)<\/td>/g;
    const tickets: Ticket[] = [];
    let match;
    
    while ((match = tourDataRegex.exec(html)) !== null) {
      const netLink = `https://phish.net${match[1]}`;
      const dateStr = match[2].split('-'); // Format: month-day-year
      const venue = match[3].trim();
      const location = match[4].trim();
      
      // Format date as "Month Day, Year"
      const dateParts = dateStr[0].split('-');
      if (dateParts.length >= 3) {
        const monthNum = parseInt(dateParts[0]);
        const day = parseInt(dateParts[1]);
        const yearPart = parseInt(dateParts[2]);
        
        const date = new Date(yearPart, monthNum - 1, day);
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        
        // Use a default image for all entries
        const imageUrl = '/images/2024-07-30-chaifetz-arena.jpg';
        
        tickets.push({
          year,
          date: formattedDate,
          venue,
          city_state: location,
          imageUrl,
          net_link: netLink
        });
      }
    }
    
    console.log(`Found ${tickets.length} shows for ${year}`);
    return tickets;
  } catch (error) {
    console.error(`Error fetching tour data for ${year}:`, error);
    return [];
  }
}

// Main function to scrape all tour data and export to CSV
export async function scrapePhishTourData(): Promise<string> {
  try {
    const years = await fetchPhishTourYears();
    let allTickets: Ticket[] = [];
    
    // Fetch data for each year
    for (const year of years) {
      const yearTickets = await fetchTourDataForYear(year);
      allTickets = [...allTickets, ...yearTickets];
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Export to CSV
    const csvContent = exportToCsv(allTickets);
    
    // Save to file
    const filePath = path.join(process.cwd(), 'src/data/phish_tour_data.csv');
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`Scraped data for ${allTickets.length} shows and saved to ${filePath}`);
    
    // Also update the tickets.json file
    const jsonData = {
      years: [...new Set(allTickets.map(ticket => ticket.year))].sort(),
      tickets: allTickets
    };
    
    const jsonFilePath = path.join(process.cwd(), 'src/data/tickets.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
    console.log(`Updated tickets.json with scraped data`);
    
    return filePath;
  } catch (error) {
    console.error('Error scraping Phish tour data:', error);
    throw error;
  }
}

// Export a function to run the scraper from command line
export async function runScraper(): Promise<void> {
  try {
    const filePath = await scrapePhishTourData();
    console.log(`Scraping completed. Data saved to ${filePath}`);
  } catch (error) {
    console.error('Failed to run scraper:', error);
    process.exit(1);
  }
} 