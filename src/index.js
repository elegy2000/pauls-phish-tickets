const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

// Base URL for Phish.net
const BASE_URL = 'https://phish.net';

// CSV writer setup
const csvWriter = createCsvWriter({
  path: path.join(__dirname, '../data/phish_tours.csv'),
  header: [
    { id: 'year', title: 'YEAR' },
    { id: 'date', title: 'Date' },
    { id: 'venue', title: 'VENUE' },
    { id: 'location', title: 'CITY, ST' },
    { id: 'imageurl', title: 'imageurl' },
    { id: 'netLink', title: '.net link' }
  ]
});

// Function to fetch HTML from a URL
async function fetchHtml(url) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Log the first 500 characters of the response to help debug
    console.log(`Response preview: ${response.data.substring(0, 500)}...`);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers:`, error.response.headers);
    }
    return null;
  }
}

// Function to format date from YYYY-MM-DD to "Month DD, YYYY"
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(n => parseInt(n, 10));
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${monthNames[month - 1]} ${day}, ${year}`;
}

// Function to capitalize words in a string
function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Function to parse a tour page and extract show data
async function parseTourPage(tourUrl, tourYear) {
  console.log(`Parsing tour: ${tourUrl}`);
  const html = await fetchHtml(`${BASE_URL}${tourUrl}`);
  
  if (!html) {
    console.log(`No HTML returned for ${tourUrl}`);
    return [];
  }
  
  const $ = cheerio.load(html);
  const shows = [];
  
  // Try multiple selectors to find show links
  const selectors = [
    'a[href*="/setlists/phish-"]',
    'a[href*="/setlist/"]',
    'tr td a[href*="/setlist/"]',
    'tr td a[href*="/setlists/"]',
    'table tr td a',  // More generic selector
    'div.tour-dates a', // Common class for tour dates
    'div.show-list a', // Another common class
    'div.tour-show a'  // Another common class
  ];
  
  let foundShows = false;
  
  for (const selector of selectors) {
    console.log(`Trying selector: ${selector}`);
    const elements = $(selector);
    console.log(`Found ${elements.length} elements with this selector`);
    
    elements.each((_, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      if (!href) return;
      
      // Get the full text content, normalizing whitespace
      let showText = $link.text()
        .replace(/\s+/g, ' ')  // Normalize spaces
        .trim();
      
      console.log(`Processing link: ${showText} (${href})`);
      
      // Try different date formats
      const dateFormats = [
        /^(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
        /^(\d{2}-\d{2}-\d{4})/,  // MM-DD-YYYY
        /^(\d{2}\/\d{2}\/\d{4})/, // MM/DD/YYYY
        /(\d{4}-\d{2}-\d{2})/,    // YYYY-MM-DD anywhere in text
        /(\d{2}-\d{2}-\d{4})/,    // MM-DD-YYYY anywhere in text
        /(\d{2}\/\d{2}\/\d{4})/   // MM/DD/YYYY anywhere in text
      ];
      
      let dateString = null;
      for (const format of dateFormats) {
        const match = showText.match(format);
        if (match) {
          dateString = match[1];
          console.log(`Found date: ${dateString}`);
          break;
        }
      }
      
      if (!dateString) {
        // Try to extract date from URL
        const urlDateMatch = href.match(/(\d{4}-\d{2}-\d{2})/);
        if (urlDateMatch) {
          dateString = urlDateMatch[1];
          console.log(`Found date in URL: ${dateString}`);
        } else {
          console.log(`No date found for: ${showText}`);
          return;
        }
      }
      
      // Validate that the show year matches the tour year
      const showYear = parseInt(dateString.substring(0, 4), 10);
      if (showYear !== tourYear) {
        console.log(`Skipping show from ${showYear} (expected ${tourYear})`);
        return;
      }
      
      // Parse the date parts for formatted date
      const formattedDate = formatDate(dateString);
      
      // Extract venue and location
      let venue = '';
      let location = '';
      
      // Try to get venue and location from parent row
      const $row = $link.closest('tr');
      if ($row.length) {
        const $cells = $row.find('td');
        if ($cells.length >= 2) {
          venue = $cells.eq(0).text().trim();
          location = $cells.eq(1).text().trim();
          console.log(`Found venue/location in row: ${venue} / ${location}`);
        }
      }
      
      // If no venue/location found in row, try to extract from URL
      if (!venue || !location) {
        const urlParts = href.split('/').pop().split('-');
        if (urlParts.length >= 3) {
          venue = capitalizeWords(urlParts.slice(0, -2).join(' ').replace(/-/g, ' '));
          const city = capitalizeWords(urlParts[urlParts.length - 3].replace(/-/g, ' '));
          const state = urlParts[urlParts.length - 2].toUpperCase();
          location = `${city}, ${state}`;
          console.log(`Found venue/location in URL: ${venue} / ${location}`);
        }
      }
      
      // If still no venue, use the show text
      if (!venue) {
        venue = showText.substring(dateString.length).trim();
        console.log(`Using show text as venue: ${venue}`);
      }
      
      shows.push({
        year: tourYear,
        date: formattedDate,
        venue: venue,
        location: location,
        imageurl: '/images/default-show.jpg',
        netLink: `${BASE_URL}${href}`
      });
      
      foundShows = true;
    });
    
    // If we found shows with this selector, break the loop
    if (foundShows) {
      console.log(`Found shows using selector: ${selector}`);
      break;
    }
  }
  
  console.log(`Found ${shows.length} shows in ${tourYear} tour`);
  return shows;
}

// Function to save data to a JSON file for debugging
function saveToJson(data, filename) {
  try {
    // Sanitize filename by replacing invalid characters with underscores
    const sanitizedFilename = filename.replace(/[\/\\?%*:|"<>]/g, '_');
    const jsonPath = path.join(__dirname, '../data', sanitizedFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`Saved data to ${jsonPath}`);
  } catch (error) {
    console.error(`Error saving ${filename}:`, error.message);
    // Don't throw the error - allow the scraper to continue
  }
}

// Main function to scrape all tour data
async function scrapePhishTours() {
  console.log('Starting Phish tour data scraper...');
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // List of tours to scrape
  const toursToScrape = [
    { url: '/tour/1-1983-tour.html', year: '1983', shows: 2 },
    { url: '/tour/2-1984-tour.html', year: '1984', shows: 3 },
    { url: '/tour/3-1985-tour.html', year: '1985', shows: 28 },
    { url: '/tour/4-1986-tour.html', year: '1986', shows: 19 },
    { url: '/tour/5-1987-tour.html', year: '1987', shows: 42 },
    { url: '/tour/6-1988-tour.html', year: '1988', shows: 95 },
    { url: '/tour/7-1989-tour.html', year: '1989', shows: 128 },
    { url: '/tour/60-1990-tour.html', year: '1990', shows: 147 },
    { url: '/tour/10-1991-fall-tour.html', year: '1991 Fall', shows: 49 },
    { url: '/tour/9-1991-giant-country-horns-summer-tour.html', year: '1991 Summer', shows: 14 },
    { url: '/tour/8-1991-winterspring-tour.html', year: '1991 Winter', shows: 63 },
    { url: '/tour/18-1992-fall-tour.html', year: '1992 Fall', shows: 21 },
    { url: '/tour/19-1992-nye-run.html', year: '1992 NYE', shows: 4 },
    { url: '/tour/11-1992-spring-tour.html', year: '1992 Spring', shows: 54 },
    { url: '/tour/12-1992-summer-european-tour.html', year: '1992 Summer Europe', shows: 8 },
    { url: '/tour/17-1992-summer-us-tour.html', year: '1992 Summer US', shows: 34 },
    { url: '/tour/22-1993-nye-run.html', year: '1993 NYE', shows: 4 },
    { url: '/tour/21-1993-summer-tour.html', year: '1993 Summer', shows: 33 },
    { url: '/tour/20-1993-winterspring-tour.html', year: '1993 Winter/Spring', shows: 71 },
    { url: '/tour/25-1994-fall-tour.html', year: '1994 Fall', shows: 46 },
    { url: '/tour/26-1994-nye-run.html', year: '1994 NYE', shows: 4 },
    { url: '/tour/23-1994-spring-tour.html', year: '1994 Spring', shows: 44 },
    { url: '/tour/24-1994-summer-tour.html', year: '1994 Summer', shows: 29 },
    { url: '/tour/28-1995-fall-tour.html', year: '1995 Fall', shows: 54 },
    { url: '/tour/29-1995-nye-run.html', year: '1995 NYE', shows: 4 },
    { url: '/tour/27-1995-summer-tour.html', year: '1995 Summer', shows: 22 },
    { url: '/tour/32-1996-fall-tour.html', year: '1996 Fall', shows: 35 },
    { url: '/tour/33-1996-nye-run.html', year: '1996 NYE', shows: 4 },
    { url: '/tour/30-1996-summer-european-tour.html', year: '1996 Summer Europe', shows: 18 },
    { url: '/tour/31-1996-summer-us-tour.html', year: '1996 Summer US', shows: 12 },
    { url: '/tour/37-1997-fall-tour.html', year: '1997 Fall', shows: 21 },
    { url: '/tour/38-1997-nye-run.html', year: '1997 NYE', shows: 4 },
    { url: '/tour/35-1997-summer-european-tour.html', year: '1997 Summer Europe', shows: 19 },
    { url: '/tour/36-1997-summer-us-tour.html', year: '1997 Summer US', shows: 19 },
    { url: '/tour/34-1997-winter-european-tour.html', year: '1997 Winter Europe', shows: 14 },
    { url: '/tour/42-1998-fall-tour.html', year: '1998 Fall', shows: 22 },
    { url: '/tour/39-1998-island-tour.html', year: '1998 Island', shows: 4 },
    { url: '/tour/40-1998-summer-tour.html', year: '1998 Summer', shows: 22 },
    { url: '/tour/41-1998-winter-tour.html', year: '1998 Winter', shows: 8 },
    { url: '/tour/45-1999-fall-tour.html', year: '1999 Fall', shows: 14 },
    { url: '/tour/46-1999-nye-run.html', year: '1999 NYE', shows: 4 },
    { url: '/tour/43-1999-summer-tour.html', year: '1999 Summer', shows: 32 },
    { url: '/tour/44-1999-winter-tour.html', year: '1999 Winter', shows: 8 },
    { url: '/tour/49-2000-fall-tour.html', year: '2000 Fall', shows: 19 },
    { url: '/tour/47-2000-summer-tour.html', year: '2000 Summer', shows: 23 },
    { url: '/tour/48-2000-winter-tour.html', year: '2000 Winter', shows: 4 },
    { url: '/tour/50-2003-winter-tour.html', year: '2003 Winter', shows: 12 },
    { url: '/tour/51-2003-summer-tour.html', year: '2003 Summer', shows: 19 },
    { url: '/tour/52-2003-winter-tour.html', year: '2003 Winter', shows: 17 },
    { url: '/tour/53-2004-summer-tour.html', year: '2004 Summer', shows: 17 },
    { url: '/tour/54-2009-summer-tour.html', year: '2009 Summer', shows: 13 },
    { url: '/tour/55-2009-fall-tour.html', year: '2009 Fall', shows: 16 },
    { url: '/tour/56-2009-nye-run.html', year: '2009 NYE', shows: 4 },
    { url: '/tour/57-2010-summer-tour.html', year: '2010 Summer', shows: 29 },
    { url: '/tour/58-2010-fall-tour.html', year: '2010 Fall', shows: 14 },
    { url: '/tour/59-2010-nye-run.html', year: '2010 NYE', shows: 5 },
    { url: '/tour/61-2011-summer-tour.html', year: '2011 Summer', shows: 30 },
    { url: '/tour/62-2011-fall-tour.html', year: '2011 Fall', shows: 3 },
    { url: '/tour/63-2011-nye-run.html', year: '2011 NYE', shows: 4 },
    { url: '/tour/64-2012-summer-tour.html', year: '2012 Summer', shows: 22 },
    { url: '/tour/65-2012-nye-run.html', year: '2012 NYE', shows: 4 },
    { url: '/tour/66-2013-summer-tour.html', year: '2013 Summer', shows: 25 },
    { url: '/tour/67-2013-fall-tour.html', year: '2013 Fall', shows: 30 },
    { url: '/tour/68-2013-nye-run.html', year: '2013 NYE', shows: 4 },
    { url: '/tour/69-2014-summer-tour.html', year: '2014 Summer', shows: 35 },
    { url: '/tour/70-2014-fall-tour.html', year: '2014 Fall', shows: 7 },
    { url: '/tour/71-2014-nye-run.html', year: '2014 NYE', shows: 4 },
    { url: '/tour/72-2015-summer-tour.html', year: '2015 Summer', shows: 25 },
    { url: '/tour/73-2015-fall-tour.html', year: '2015 Fall', shows: 6 },
    { url: '/tour/74-2015-nye-run.html', year: '2015 NYE', shows: 4 },
    { url: '/tour/75-2016-summer-tour.html', year: '2016 Summer', shows: 20 },
    { url: '/tour/76-2016-fall-tour.html', year: '2016 Fall', shows: 13 },
    { url: '/tour/77-2016-nye-run.html', year: '2016 NYE', shows: 4 },
    { url: '/tour/78-2017-summer-tour.html', year: '2017 Summer', shows: 17 },
    { url: '/tour/79-2017-bakers-dozen.html', year: '2017 Bakers Dozen', shows: 13 },
    { url: '/tour/80-2017-fall-tour.html', year: '2017 Fall', shows: 3 },
    { url: '/tour/81-2017-nye-run.html', year: '2017 NYE', shows: 4 },
    { url: '/tour/82-2018-summer-tour.html', year: '2018 Summer', shows: 24 },
    { url: '/tour/83-2018-fall-tour.html', year: '2018 Fall', shows: 14 },
    { url: '/tour/84-2018-nye-run.html', year: '2018 NYE', shows: 4 },
    { url: '/tour/85-2019-summer-tour.html', year: '2019 Summer', shows: 26 },
    { url: '/tour/86-2019-fall-tour.html', year: '2019 Fall', shows: 7 },
    { url: '/tour/87-2019-nye-run.html', year: '2019 NYE', shows: 4 },
    { url: '/tour/88-2021-summer-tour.html', year: '2021 Summer', shows: 34 },
    { url: '/tour/89-2021-fall-tour.html', year: '2021 Fall', shows: 4 },
    { url: '/tour/90-2021-nye-run.html', year: '2021 NYE', shows: 4 },
    { url: '/tour/91-2022-spring-tour.html', year: '2022 Spring', shows: 3 },
    { url: '/tour/92-2022-summer-tour.html', year: '2022 Summer', shows: 34 },
    { url: '/tour/93-2022-fall-tour.html', year: '2022 Fall', shows: 4 },
    { url: '/tour/94-2022-nye-run.html', year: '2022 NYE', shows: 4 },
    { url: '/tour/95-2023-summer-tour.html', year: '2023 Summer', shows: 25 },
    { url: '/tour/96-2023-nye-run.html', year: '2023 NYE', shows: 4 },
    { url: '/tour/97-2024-mexico.html', year: '2024 Mexico', shows: 4 },
    { url: '/tour/98-2024-summer-tour.html', year: '2024 Summer', shows: 24 },
    { url: '/tour/99-2024-fall-tour.html', year: '2024 Fall', shows: 13 },
    { url: '/tour/100-2024-nye-run.html', year: '2024 NYE', shows: 4 },
    { url: '/tour/101-2025-summer-tour.html', year: '2025 Summer', shows: 13 }
  ];
  
  let allShows = [];
  let totalShowsFound = 0;
  let totalShowsExpected = 0;
  
  for (const tour of toursToScrape) {
    try {
      const shows = await parseTourPage(tour.url, tour.year);
      if (shows && shows.length > 0) {
        allShows = allShows.concat(shows);
        totalShowsFound += shows.length;
        totalShowsExpected += tour.shows;
        console.log(`Processed ${tour.year}: Found ${shows.length} shows (Expected: ${tour.shows})`);
        saveToJson(shows, `${tour.year}_tour.json`);
      } else {
        console.log(`Warning: No shows found for ${tour.year}`);
      }
    } catch (error) {
      console.error(`Error processing ${tour.year}:`, error.message);
      // Continue with next tour
    }
  }
  
  console.log(`Total shows found: ${totalShowsFound} (Expected: ${totalShowsExpected})`);
  
  // Write all shows to CSV
  try {
    await csvWriter.writeRecords(allShows);
    console.log('Successfully wrote all shows to CSV');
  } catch (error) {
    console.error('Error writing CSV:', error.message);
  }
  
  // Save all shows to JSON for debugging
  saveToJson(allShows, 'all_shows.json');
}

// Run the scraper
scrapePhishTours().catch(error => {
  console.error('Error:', error);
}); 