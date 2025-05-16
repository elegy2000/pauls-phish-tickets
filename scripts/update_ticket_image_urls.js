// Usage: node scripts/update_ticket_image_urls.js
// Updates imageUrl fields in public/data/tickets.json using Supabase URLs from scripts/supabase_image_mapping.json

const fs = require('fs');
const path = require('path');

const TICKETS_PATH = path.join(__dirname, '../public/data/tickets.json');
const MAPPING_PATH = path.join(__dirname, 'supabase_image_mapping.json');

// Read mapping
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
// Read tickets data
const data = JSON.parse(fs.readFileSync(TICKETS_PATH, 'utf8'));

let updatedCount = 0;

if (Array.isArray(data.tickets)) {
  data.tickets.forEach(ticket => {
    if (ticket.imageUrl && ticket.imageUrl.startsWith('/images/')) {
      const filename = ticket.imageUrl.replace('/images/', '');
      if (mapping[filename]) {
        ticket.imageUrl = mapping[filename];
        updatedCount++;
      }
    }
  });
  fs.writeFileSync(TICKETS_PATH, JSON.stringify(data, null, 2));
  console.log(`Updated ${updatedCount} ticket image URLs in tickets.json.`);
} else {
  console.error('No tickets array found in tickets.json');
  process.exit(1);
} 