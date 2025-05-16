const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const csvFilePath = path.join(__dirname, '../data/phish_tours.csv');
const jsonFilePath = path.join(__dirname, '../src/data/tickets.json');

// Read the CSV file and convert to JSON
const results = [];
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    // Convert the data to match the expected format
    const ticket = {
      year: parseInt(data.YEAR),
      date: data.Date,
      venue: data.VENUE,
      city_state: data['CITY, ST'],
      imageUrl: data.imageUrl,
      net_link: data['.net link']
    };
    results.push(ticket);
  })
  .on('end', () => {
    // Extract unique years
    const years = [...new Set(results.map(ticket => ticket.year))].sort((a, b) => b - a);
    
    // Create the final data structure
    const finalData = {
      years,
      tickets: results
    };
    
    // Write to JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(finalData, null, 2));
    console.log(`Successfully converted CSV to JSON and saved to ${jsonFilePath}`);
  }); 