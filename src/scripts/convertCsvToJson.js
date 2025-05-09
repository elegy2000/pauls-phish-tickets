import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvFilePath = path.join(__dirname, '../../public/data/phish_tours.csv');
const csvContent = fs.readFileSync(csvFilePath, 'utf8');

// Parse the CSV data
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});

// Transform the data to match the expected format
const shows = records.map(record => ({
  year: record.YEAR,
  date: record.Date,
  venue: record.VENUE,
  location: record['CITY, ST'],
  imageUrl: record.imageUrl,
  netLink: record['.net link']
}));

// Write the JSON file
const jsonFilePath = path.join(__dirname, '../../public/data/all_shows.json');
fs.writeFileSync(jsonFilePath, JSON.stringify(shows, null, 2));

console.log(`Converted ${shows.length} shows to JSON format`); 