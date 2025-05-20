import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging for environment variables
console.log('API Route: add-ticket.js - Environment Check:', {
  supabaseUrlExists: !!supabaseUrl,
  supabaseKeyPrefix: supabaseKey ? `${supabaseKey.substring(0, 6)}...` : 'missing'
});

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Received ticket data:', JSON.stringify(req.body, null, 2));
    
    const ticket = req.body;
    
    // Validate required fields
    if (!ticket.year || !ticket.date || !ticket.venue || !ticket.city_state) {
      console.error('Validation failed:', { 
        year: !!ticket.year, 
        date: !!ticket.date,
        venue: !!ticket.venue,
        city_state: !!ticket.city_state 
      });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Prepare ticket data for Supabase
    const supabaseTicket = {
      year: Number(ticket.year),
      date: ticket.date,
      venue: ticket.venue,
      city_state: ticket.city_state,
      imageurl: ticket.imageFileName ? `${supabaseUrl}/storage/v1/object/public/ticket-images/${ticket.imageFileName.trim()}` : '',
      net_link: ticket.net_link || ''
    };

    // Insert into Supabase
    try {
      const { data, error } = await supabase
        .from('ticket_stubs')
        .insert([supabaseTicket])
        .select();

      if (error) {
        console.error('Supabase insert failed:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to insert ticket',
          error: error.message 
        });
      }
      console.log('Supabase insert successful:', data);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Ticket added successfully',
        ticket: data[0]
      });
    } catch (insertErr) {
      console.error('Supabase insert threw error:', insertErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Error inserting ticket',
        error: insertErr.message 
      });
    }
  } catch (error) {
    console.error('Unexpected error in add-ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 