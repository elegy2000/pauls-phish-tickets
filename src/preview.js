const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Number of rows to display
const LIMIT = 10;

// Function to preview CSV data
async function previewCsv(csvPath) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (results.length < LIMIT) {
          results.push(data);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Main function
async function main() {
  const csvPath = path.join(__dirname, '../data/phish_tours.csv');
  
  try {
    console.log('Previewing Phish Tour Data CSV:');
    console.log('-------------------------------\n');
    
    const data = await previewCsv(csvPath);
    
    // Calculate column widths
    const columnWidths = {
      YEAR: Math.max(...data.map(row => row.YEAR.length), 'YEAR'.length) + 2,
      Date: Math.max(...data.map(row => row.Date.length), 'Date'.length) + 2,
      VENUE: Math.max(...data.map(row => row.VENUE.length), 'VENUE'.length) + 2,
      'CITY, ST': Math.max(...data.map(row => row['CITY, ST'].length), 'CITY, ST'.length) + 2
    };
    
    // Print header
    console.log(
      'YEAR'.padEnd(columnWidths.YEAR) +
      'Date'.padEnd(columnWidths.Date) +
      'VENUE'.padEnd(columnWidths.VENUE) +
      'CITY, ST'.padEnd(columnWidths['CITY, ST'])
    );
    
    // Print separator
    console.log(
      '-'.repeat(columnWidths.YEAR) +
      '-'.repeat(columnWidths.Date) +
      '-'.repeat(columnWidths.VENUE) +
      '-'.repeat(columnWidths['CITY, ST'])
    );
    
    // Print data rows
    data.forEach(row => {
      console.log(
        row.YEAR.padEnd(columnWidths.YEAR) +
        row.Date.padEnd(columnWidths.Date) +
        row.VENUE.padEnd(columnWidths.VENUE) +
        row['CITY, ST'].padEnd(columnWidths['CITY, ST'])
      );
    });
    
    console.log('\n');
    console.log(`Showing ${data.length} of ${await getTotalRows(csvPath)} total rows`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to count total rows in CSV
async function getTotalRows(csvPath) {
  return new Promise((resolve, reject) => {
    let count = 0;
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', () => {
        count++;
      })
      .on('end', () => {
        resolve(count);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Run the preview
main().catch(console.error); 