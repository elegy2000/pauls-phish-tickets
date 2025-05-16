import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://phish.net';
const TOUR_URL = `${BASE_URL}/tour`;
const DEBUG_DIR = path.join(process.cwd(), 'debug');

/**
 * Save HTML content to a file for debugging
 */
async function saveHtmlToFile(content: string, filename: string) {
  try {
    await fs.mkdir(DEBUG_DIR, { recursive: true });
    await fs.writeFile(path.join(DEBUG_DIR, filename), content);
    console.log(`Saved HTML to ${filename}`);
  } catch (error) {
    console.error(`Error saving HTML to file: ${error}`);
  }
}

/**
 * Fetch the main tour list page
 */
async function fetchTourList() {
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
    
    // Save the HTML for analysis
    await saveHtmlToFile(response.data, 'tour-list.html');
    
    // Parse the HTML to find table structure
    const $ = cheerio.load(response.data);
    
    console.log('HTML Structure Analysis:');
    console.log('----------------------');
    
    // Find tables
    const tables = $('table');
    console.log(`Found ${tables.length} tables`);
    
    tables.each((i, table) => {
      console.log(`Table ${i + 1}:`);
      console.log(`  Headers: ${$(table).find('th').length}`);
      console.log(`  Rows: ${$(table).find('tr').length}`);
      
      // Print first row structure
      const firstRow = $(table).find('tr').first();
      console.log(`  First row cells: ${firstRow.find('td, th').length}`);
      
      // Print headers
      const headers: string[] = [];
      firstRow.find('th').each((_, th) => {
        headers.push($(th).text().trim());
      });
      console.log(`  Headers: ${headers.join(' | ')}`);
    });
    
    // Get tour URLs
    const tourLinks: {name: string, url: string}[] = [];
    $('a[href*="/tour/"]').each((_, link) => {
      const href = $(link).attr('href');
      if (href && href.includes('/tour/')) {
        tourLinks.push({
          name: $(link).text().trim(),
          url: `${BASE_URL}${href}`
        });
      }
    });
    
    console.log(`Found ${tourLinks.length} tour links`);
    if (tourLinks.length > 0) {
      console.log('First 5 tour links:');
      tourLinks.slice(0, 5).forEach(link => {
        console.log(`  ${link.name}: ${link.url}`);
      });
      
      // Fetch first tour for analysis
      await fetchTourPage(tourLinks[0].url, tourLinks[0].name);
    }
    
  } catch (error) {
    console.error('Error fetching tour list:', error);
  }
}

/**
 * Fetch a specific tour page for analysis
 */
async function fetchTourPage(url: string, tourName: string) {
  console.log(`\nFetching tour page for "${tourName}" at ${url}...`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch tour page: ${response.status}`);
    }
    
    // Save the HTML for analysis
    const filename = `tour-${tourName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    await saveHtmlToFile(response.data, filename);
    
    // Parse the HTML to find show structure
    const $ = cheerio.load(response.data);
    
    console.log('Tour Page Structure Analysis:');
    console.log('---------------------------');
    
    // Look for .setlist-block
    const setlistBlocks = $('.setlist-block');
    console.log(`Found ${setlistBlocks.length} .setlist-block elements`);
    
    // Look for table.setlist
    const setlistTables = $('table.setlist');
    console.log(`Found ${setlistTables.length} table.setlist elements`);
    
    // Look for tables
    const tables = $('table');
    console.log(`Found ${tables.length} tables total`);
    
    // Look for rows with dates (likely shows)
    let potentialShowRows = 0;
    $('tr').each((_, row) => {
      const text = $(row).text().trim();
      // Check if row text contains a date format (MM-DD-YYYY or similar)
      if (/\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/.test(text) || 
          /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/i.test(text)) {
        potentialShowRows++;
      }
    });
    console.log(`Found ${potentialShowRows} table rows that may contain show dates`);
    
    // Look for any links that might be setlist links
    const setlistLinks = $('a[href*="/setlists/"]');
    console.log(`Found ${setlistLinks.length} links that might point to setlists`);
    
    if (setlistLinks.length > 0) {
      console.log('First 5 potential setlist links:');
      setlistLinks.slice(0, 5).each((i, link) => {
        console.log(`  ${i + 1}: ${$(link).text().trim()} - ${$(link).attr('href')}`);
      });
    }
    
    // Analyze the first few show rows in detail
    console.log('\nDetailed analysis of potential show rows:');
    
    // Try different selectors that might contain show info
    const selectors = [
      'table tr', 
      '.setlist tr', 
      '.history-entry',
      '.table-responsive tr'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector '${selector}'`);
        
        // Analyze first 3 elements
        elements.slice(0, 3).each((i, el) => {
          console.log(`\n${selector} ${i + 1}:`);
          console.log(`  Text: ${$(el).text().trim().substring(0, 100)}...`);
          console.log(`  HTML structure: ${$(el).html()?.substring(0, 150)}...`);
          
          // Extract children
          const children = $(el).children();
          console.log(`  Children: ${children.length}`);
          
          children.each((j, child) => {
            console.log(`    Child ${j + 1}: ${$(child).prop('tagName')} - ${$(child).text().trim().substring(0, 50)}`);
          });
          
          // Try to extract date, venue, location
          const possibleDateElements = $(el).find('a, span, td').filter((_, e) => {
            const text = $(e).text().trim();
            return /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/.test(text) || 
                  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/i.test(text);
          });
          
          if (possibleDateElements.length > 0) {
            console.log(`    Possible date: ${possibleDateElements.first().text().trim()}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error(`Error fetching tour page: ${error}`);
  }
}

// Run the debug script
console.log('Starting HTML structure analysis...');
fetchTourList(); 