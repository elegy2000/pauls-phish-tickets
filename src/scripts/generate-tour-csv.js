const fs = require('fs');
const path = require('path');

// Function to convert date string to ISO format (YYYY-MM-DD)
function convertToISODate(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

// Read the tour data from our existing JSON
const tourData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/all_shows.json'), 'utf8'));

// Create CSV header
const csvHeader = 'Tour Name,Date,Venue,Location\n';

// Convert data to CSV rows
const csvRows = tourData.map(show => {
  const tourName = show.year;
  const date = show.date;
  const venue = show.venue.replace(/,/g, '');
  const location = show.location.replace(/,/g, '');

  return `${tourName},${date},${venue},${location}`;
}).join('\n');

// Combine header and rows
const csvContent = csvHeader + csvRows;

// Write to CSV file
const csvFilePath = path.join(process.cwd(), 'public/data/phish_tours.csv');
fs.writeFileSync(csvFilePath, csvContent);

console.log(`CSV file generated at: ${csvFilePath}`);
console.log(`Total shows in CSV: ${tourData.length}`); 