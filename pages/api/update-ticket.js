import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Received update ticket data:', JSON.stringify(req.body, null, 2));
    
    const { id, ...ticketData } = req.body;
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({ success: false, message: 'Ticket ID is required' });
    }

    if (!ticketData.year || !ticketData.date || !ticketData.venue || !ticketData.city_state) {
      console.error('Validation failed:', { 
        year: !!ticketData.year, 
        date: !!ticketData.date,
        venue: !!ticketData.venue,
        city_state: !!ticketData.city_state 
      });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Prepare ticket data for Supabase
    const supabaseTicket = {
      year: Number(ticketData.year),
      date: ticketData.date,
      venue: ticketData.venue,
      city_state: ticketData.city_state,
      imageurl: ticketData.imageurl || '',
      net_link: ticketData.net_link || ''
    };

    // Update in Supabase
    const { data, error } = await supabase
      .from('ticket_stubs')
      .update(supabaseTicket)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update failed:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update ticket',
        error: error.message 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    console.log('Supabase update successful:', data);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Ticket updated successfully',
      ticket: data[0]
    });
  } catch (error) {
    console.error('Unexpected error in update-ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 