const fs = require('fs');
const path = require('path');

// Sample data from the user's request
const sampleData = [
  { year: 1998, date: "April 2, 1998", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-02-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1998, date: "January 2, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-03-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1998, date: "April 2, 1998", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-02-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1998, date: "March 5, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-03-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 2021, date: "June 6, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-02-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 2021, date: "December 1, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-03-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1999, date: "March 5, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-02-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1980, date: "August 12, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-03-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1975, date: "February 2, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-02-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1999, date: "January 1, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-03-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 1999, date: "March 6, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-02-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 2000, date: "June 3, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-03-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 2000, date: "July 7, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-02-1998-nassau-coliseum-uniondale-ny-usa.html" },
  { year: 2000, date: "August 20, 2025", venue: "Nassau Coliseum", city_state: "Uniondale, NY", imageUrl: "/images/2024-07-30-chaifetz-arena.jpg", net_link: "https://phish.net/setlists/phish-april-03-1998-nassau-coliseum-uniondale-ny-usa.html" }
];

// Function to export data to CSV
function exportToCsv(tickets) {
  const headers = ['YEAR', 'Date', 'VENUE', 'CITY, ST', 'imageUrl', '.net link'];
  const csvContent = [
    headers.join(','),
    ...tickets.map(ticket => [
      ticket.year,
      `"${ticket.date.replace(/"/g, '""')}"`,
      `"${ticket.venue.replace(/"/g, '""')}"`,
      `"${ticket.city_state.replace(/"/g, '""')}"`,
      `"${ticket.imageUrl.replace(/"/g, '""')}"`,
      `"${ticket.net_link.replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

// Main function to export sample data
function exportSampleData() {
  try {
    // Export to CSV
    const csvContent = exportToCsv(sampleData);
    
    // Save to file
    const filePath = path.join(process.cwd(), 'src/data/phish_tour_data.csv');
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`Exported sample data with ${sampleData.length} shows to ${filePath}`);
    
    // Also update the tickets.json file
    const jsonData = {
      years: [...new Set(sampleData.map(ticket => ticket.year))].sort((a, b) => a - b),
      tickets: sampleData
    };
    
    const jsonFilePath = path.join(process.cwd(), 'src/data/tickets.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
    console.log(`Updated tickets.json with sample data`);
    
    return filePath;
  } catch (error) {
    console.error('Error exporting sample data:', error);
    throw error;
  }
}

// Run the export
try {
  const filePath = exportSampleData();
  console.log(`Sample data export completed. Data saved to ${filePath}`);
} catch (error) {
  console.error('Failed to export sample data:', error);
  process.exit(1);
} 