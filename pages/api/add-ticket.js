import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging for environment variables
console.log('API Route: add-ticket.js - Environment Check:', {
  supabaseUrlExists: !!supabaseUrl,
  supabaseKeyPrefix: supabaseKey ? `${supabaseKey.substring(0, 6)}...` : 'missing'
});

const supabase = createClient(supabaseUrl, supabaseKey);
const JSON_FILE_PATH = path.join(process.cwd(), 'public/data/tickets.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Received ticket data:', JSON.stringify(req.body, null, 2));
    
    const ticket = req.body;
    
    // Validate required fields
    if (!ticket.show || !ticket.date) {
      console.error('Validation failed:', { show: !!ticket.show, date: !!ticket.date });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Test Supabase connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('ticket_stubs')
        .select('count(*)')
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        return res.status(500).json({ 
          success: false, 
          message: 'Database connection failed',
          error: testError.message 
        });
      }
      console.log('Supabase connection test successful:', testData);
    } catch (testErr) {
      console.error('Supabase connection test threw error:', testErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error',
        error: testErr.message 
      });
    }

    // Insert into Supabase
    try {
      const { data, error } = await supabase
        .from('ticket_stubs')
        .insert([ticket])
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
    } catch (insertErr) {
      console.error('Supabase insert threw error:', insertErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Error inserting ticket',
        error: insertErr.message 
      });
    }

    // Update local JSON file
    try {
      const tickets = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
      tickets.push(ticket);
      fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(tickets, null, 2));
      console.log('Local JSON file updated successfully');
    } catch (fsErr) {
      console.error('Failed to update local JSON:', fsErr);
      // Don't fail the request if local JSON update fails
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Ticket added successfully' 
    });

  } catch (error) {
    console.error('Unexpected error in add-ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 