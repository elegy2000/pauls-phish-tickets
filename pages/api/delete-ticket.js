import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Received delete ticket request:', JSON.stringify(req.body, null, 2));
    
    const { id } = req.body;
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({ success: false, message: 'Ticket ID is required' });
    }

    // First, fetch the ticket to confirm it exists and get data for the response
    const { data: existingTicket, error: fetchError } = await supabase
      .from('ticket_stubs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching ticket for deletion:', fetchError);
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('ticket_stubs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete failed:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete ticket',
        error: error.message 
      });
    }

    console.log('Supabase delete successful for ticket:', existingTicket);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Ticket deleted successfully',
      deletedTicket: existingTicket
    });
  } catch (error) {
    console.error('Unexpected error in delete-ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 