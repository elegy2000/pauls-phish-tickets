const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Read the CSV file
const csvFilePath = path.join(__dirname, '../Various documents/phishticketstubs-05-09-25-images.csv');
const outputPath = path.join(__dirname, '../pauls-ticket-site/src/data/tickets.json');

try {
  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');

  // Parse the CSV data
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Parsed ${records.length} records from CSV file`);

  // Transform the data to match the expected format
  const tickets = records.map(record => {
    // Always extract year from the date field
    let parsedYear = null;
    if (record.date) {
      // Try to extract a 4-digit year from the date string
      const match = record.date.match(/(\d{4})$/);
      if (match) {
        parsedYear = parseInt(match[1], 10);
      }
    }
    return {
      year: parsedYear,
      date: record.date,
      venue: record.venue,
      city_state: record.city_state,
      imageurl: record.imageurl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-images/default-show.jpg`,
      netLink: record.net_link || ''
    };
  });

  // Get unique years
  const years = [...new Set(tickets.map(ticket => ticket.year))].sort();

  // Create the JSON structure
  const jsonData = {
    years,
    tickets
  };

  // Write the JSON file
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  console.log(`Successfully wrote ${tickets.length} shows to JSON file at ${outputPath}`);

  // Also write to the public directory for backup
  const publicOutputPath = path.join(__dirname, '../pauls-ticket-site/public/data/tickets.json');
  fs.writeFileSync(publicOutputPath, JSON.stringify(jsonData, null, 2));
  console.log(`Also wrote backup to ${publicOutputPath}`);

} catch (error) {
  console.error('Error processing CSV file:', error);
} 