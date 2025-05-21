// Usage: node scripts/update_ticket_image_urls.js
// Updates imageurl fields in public/data/tickets.json using Supabase URLs from scripts/supabase_image_mapping.json

const fs = require('fs');
const path = require('path');

const ticketsPath = path.join(__dirname, '../public/data/tickets.json');
const mappingPath = path.join(__dirname, 'supabase_image_mapping.json');

// Read the files
const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

let updatedCount = 0;

if (Array.isArray(tickets.tickets)) {
  tickets.tickets.forEach(ticket => {
    if (ticket.imageUrl && ticket.imageUrl.startsWith('/images/')) {
      const filename = ticket.imageUrl.replace('/images/', '');
      ticket.imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-images/${filename}`;
      updatedCount++;
    }
  });
  fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));
  console.log(`Updated ${updatedCount} ticket image URLs in tickets.json.`);
} else {
  console.error('No tickets array found in tickets.json');
  process.exit(1);
} 