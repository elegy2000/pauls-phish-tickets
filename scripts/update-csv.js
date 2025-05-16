const fs = require('fs');
const path = require('path');

// List of shows that have ticket stub images
const showsWithImages = [
  'october-30-1983',
  'december-2-1983',
  'december-3-1983',
  'october-23-1984',
  'november-3-1984',
  'december-1-1984',
  'february-1-1985',
  'february-22-1985'
];

// Function to convert date to image filename format
function dateToImageFilename(dateStr) {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

// Function to check if a show has an image
function hasImage(dateStr) {
  const filename = dateToImageFilename(dateStr);
  return showsWithImages.includes(filename);
}

// Function to get image path for a show
function getImagePath(dateStr) {
  if (hasImage(dateStr)) {
    return `/images/ticket-stubs/${dateToImageFilename(dateStr)}.jpg`;
  }
  return '/images/default-show.jpg';
}

// Function to standardize venue name
function standardizeVenue(venue, cityState) {
  if (!venue || /^\d{4}$/.test(venue)) {
    if (cityState) {
      const parts = cityState.split(' ');
      // If it starts with "Phish", remove it and the date parts
      if (parts[0] === 'Phish') {
        return parts.slice(4).join(' ');
      }
      return cityState;
    }
    return venue || '';
  }

  // Remove "Phish" prefix if it exists
  venue = venue.replace(/^Phish\s+/, '');
  // Remove date if it exists at the start
  venue = venue.replace(/^\d{1,2}\s+\d{4}\s+/, '');
  // Remove duplicate spaces
  venue = venue.replace(/\s+/g, ' ');
  return venue.trim();
}

// Function to get tour data
function getTourData() {
  const tourDataPath = path.join(process.cwd(), 'pauls-ticket-site', 'src', 'scripts', 'tour-data-updater.js');
  const tourDataContent = fs.readFileSync(tourDataPath, 'utf-8');
  const tourDataMatch = tourDataContent.match(/const tourData = \[([\s\S]*?)\];/);
  if (tourDataMatch) {
    const tourDataStr = tourDataMatch[1];
    // Convert the tour data string to a valid JSON array
    const tourDataJson = `[${tourDataStr.replace(/(\w+):/g, '"$1":')}]`;
    return JSON.parse(tourDataJson);
  }
  return [];
}

// Function to generate shows from tour data
function generateShowsFromTourData() {
  const tourData = getTourData();
  const shows = [];
  
  const defaultVenues = {
    'Fall Tour': 'Fall Tour Venue',
    'NYE Run': 'Madison Square Garden',
    'Spring Tour': 'Spring Tour Venue',
    'Summer European Tour': 'European Venue',
    'Summer U.S. Tour': 'Summer Venue',
    'Winter Tour': 'Winter Venue',
    'Winter/Spring Tour': 'Winter/Spring Venue',
    'Summer Tour': 'Summer Tour Venue',
    'Island Tour': 'Nassau Coliseum',
    'Summer Japan Tour': 'Japan Venue',
    'NYC Tour': 'Madison Square Garden',
    'Vegas Run': 'MGM Grand Garden Arena',
    'Hampton Reunion Run': 'Hampton Coliseum',
    'Late Summer Tour': 'Late Summer Venue',
    'Early Summer Tour': 'Early Summer Venue',
    'Mexico': 'Moon Palace Resort',
    'Sphere': 'Sphere Las Vegas',
    'Madison Square Garden Spring Run': 'Madison Square Garden'
  };

  const defaultLocations = {
    'Fall Tour': 'Various Cities, US',
    'NYE Run': 'New York, NY',
    'Spring Tour': 'Various Cities, US',
    'Summer European Tour': 'Various Cities, Europe',
    'Summer U.S. Tour': 'Various Cities, US',
    'Winter Tour': 'Various Cities, US',
    'Winter/Spring Tour': 'Various Cities, US',
    'Summer Tour': 'Various Cities, US',
    'Island Tour': 'Uniondale, NY',
    'Summer Japan Tour': 'Various Cities, Japan',
    'NYC Tour': 'New York, NY',
    'Vegas Run': 'Las Vegas, NV',
    'Hampton Reunion Run': 'Hampton, VA',
    'Late Summer Tour': 'Various Cities, US',
    'Early Summer Tour': 'Various Cities, US',
    'Mexico': 'Cancún, Mexico',
    'Sphere': 'Las Vegas, NV',
    'Madison Square Garden Spring Run': 'New York, NY'
  };

  // Process each tour
  tourData.forEach(tour => {
    const tourName = tour.name;
    const showCount = tour.shows;
    
    // Extract year and tour type
    const yearMatch = tourName.match(/^(\d{4}(?:\/\d{4})?)(?:\s+(.+))?$/);
    if (yearMatch) {
      const year = yearMatch[1];
      const tourType = yearMatch[2] || 'Tour';
      
      // Find default venue and location based on tour type
      let venue = 'Default Venue';
      let location = 'Default Location, US';
      
      for (const [key, value] of Object.entries(defaultVenues)) {
        if (tourType.includes(key)) {
          venue = value;
          location = defaultLocations[key];
          break;
        }
      }
      
      // Generate shows for this tour
      for (let i = 0; i < showCount; i++) {
        shows.push({
          year: year,
          date: `January ${i + 1}, ${year}`,
          venue: venue,
          location: location,
          netLink: `https://phish.net/tour/${year.toLowerCase()}-${tourType.toLowerCase().replace(/\s+/g, '-')}.html`
        });
      }
    }
  });
  
  return shows;
}

let allShows = [];

// Read and process all_shows.json
const allShowsPath = path.join(process.cwd(), 'data', 'all_shows.json');
if (fs.existsSync(allShowsPath)) {
  const allShowsContent = fs.readFileSync(allShowsPath, 'utf-8');
  const allShowsData = JSON.parse(allShowsContent);
  if (allShowsData.shows && Array.isArray(allShowsData.shows)) {
    allShows = allShows.concat(allShowsData.shows);
  }
}

// Read and process individual tour files
const dataDir = path.join(process.cwd(), 'data');
const tourFiles = fs.readdirSync(dataDir)
  .filter(file => file.endsWith('_tour.json'));

// Process each tour file
for (const file of tourFiles) {
  const filePath = path.join(dataDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  if (Array.isArray(data) && data.length > 0) {
    allShows = allShows.concat(data);
  } else if (data.shows && Array.isArray(data.shows)) {
    allShows = allShows.concat(data.shows);
  }
}

// Add shows from tour data for recent years
const tourShows = generateShowsFromTourData().filter(show => {
  const year = parseInt(show.year);
  return year >= 2019;
});
allShows = allShows.concat(tourShows);

// Read and process tickets.json for recent years
const ticketsPath = path.join(process.cwd(), 'pauls-ticket-site', 'src', 'data', 'tickets.json');
if (fs.existsSync(ticketsPath)) {
  const ticketsContent = fs.readFileSync(ticketsPath, 'utf-8');
  const ticketsData = JSON.parse(ticketsContent);
  
  // Add recent shows from tickets.json (2019 onwards)
  const recentShows = ticketsData.tickets
    .filter(show => show.year >= 2019)
    .map(show => {
      const dateParts = show.date.split(' ');
      const month = dateParts[0];
      const day = parseInt(dateParts[1]).toString().padStart(2, '0');
      const year = show.year;
      const fullDate = `${month} ${day}, ${year}`;
      
      return {
        year: year.toString(),
        date: fullDate,
        venue: standardizeVenue(show.venue, show.city_state),
        location: show.imageUrl || '',
        netLink: show.net_link || ''
      };
    });
  
  allShows = allShows.concat(recentShows);
}

// Remove duplicates based on date and standardized venue
const uniqueShows = allShows.filter((show, index, self) =>
  index === self.findIndex((s) => {
    const date1 = new Date(show.date).toISOString();
    const date2 = new Date(s.date).toISOString();
    const venue1 = standardizeVenue(show.venue, show.city_state || '');
    const venue2 = standardizeVenue(s.venue, s.city_state || '');
    return date1 === date2 && venue1 === venue2;
  })
);

// Sort shows by date
uniqueShows.sort((a, b) => new Date(a.date) - new Date(b.date));

// Create CSV content
const csvHeader = 'YEAR,Date,VENUE,"CITY, ST",imageUrl,.net link\n';
const csvRows = uniqueShows.map(show => {
  const date = new Date(show.date);
  const year = date.getFullYear().toString();
  const venue = standardizeVenue(show.venue, show.city_state || '');
  const cityState = show.location;
  const imageUrl = getImagePath(show.date);
  const netLink = show.netLink || '';

  return `${year},"${show.date}","${venue}","${cityState}","${imageUrl}","${netLink}"`;
}).join('\n');

const csvContent = csvHeader + csvRows;

// Write to CSV file
const csvFilePath = path.join(process.cwd(), 'pauls-ticket-site/public/data/phish_tours.csv');
fs.writeFileSync(csvFilePath, csvContent);

console.log(`Successfully updated CSV with ${uniqueShows.length} shows`);
console.log(`Shows with ticket stub images: ${showsWithImages.length}`); 