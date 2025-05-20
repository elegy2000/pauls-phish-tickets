import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log the environment variables (without revealing full key)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Supabase Key prefix:', supabaseKey?.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

const JSON_FILE_PATH = path.join(process.cwd(), 'public/data/tickets.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const ticket = req.body;
  console.log('Received ticket:', ticket);
  console.log('Type of ticket.year:', typeof ticket.year, 'Value:', ticket.year);
  console.log('Type of ticket.date:', typeof ticket.date, 'Value:', ticket.date);
  console.log('Type of ticket.venue:', typeof ticket.venue, 'Value:', ticket.venue);
  console.log('Type of ticket.city_state:', typeof ticket.city_state, 'Value:', ticket.city_state);

  // Construct imageUrl if imageFileName is provided
  if (ticket.imageFileName && ticket.imageFileName.trim() !== '') {
    ticket.imageUrl = `https://hykzrxjtkpssrfmcerky.supabase.co/storage/v1/object/public/ticket-images/${ticket.imageFileName.trim()}`;
  } else {
    ticket.imageUrl = '';
  }

  if (!ticket || !ticket.year || !ticket.date || !ticket.venue || !ticket.city_state) {
    return res.status(400).json({ success: false, message: 'Missing ticket fields' });
  }

  // Prepare object for Supabase insert (match table columns exactly)
  const supabaseTicket = {
    year: Number(ticket.year),
    date: ticket.date,
    venue: ticket.venue,
    city_state: ticket.city_state,
    imageurl: ticket.imageUrl, // lowercase for Supabase
    net_link: ticket.net_link
  };

  try {
    console.log('Attempting to insert ticket into Supabase:', supabaseTicket);
    
    // Add to Supabase with detailed error logging
    const { data, error } = await supabase
      .from('ticket_stubs')
      .insert([supabaseTicket])
      .select();

    if (error) {
      console.error('Detailed Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).json({ 
        success: false, 
        message: `Error inserting ticket into Supabase: ${error.message}`,
        details: error.details,
        code: error.code
      });
    }

    console.log('Successfully inserted ticket into Supabase:', data);

    // Add to local JSON
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
    jsonData.tickets.push(ticket);
    if (!jsonData.years.includes(ticket.year)) {
      jsonData.years.push(ticket.year);
      jsonData.years.sort((a, b) => b - a);
    }
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(jsonData, null, 2));

    res.status(200).json({ success: true, ticket });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ 
      success: false, 
      message: `Failed to add ticket: ${err.message}`,
      error: err.toString()
    });
  }
} 