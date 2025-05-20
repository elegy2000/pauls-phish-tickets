const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Initializing Supabase client with:', {
  urlExists: !!supabaseUrl,
  keyPrefix: supabaseKey ? supabaseKey.substring(0, 5) : 'missing'
});

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE_PATH = process.env.VERCEL ? '/tmp/phish_tours.csv' : path.join(process.cwd(), 'data/phish_tours.csv');

// Function to convert CSV to JSON
const convertCsvToJson = (csvData) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const parser = csv()
      .on('data', (data) => {
        // Validate required fields
        if (!data.year || !data.date || !data.venue || !data.city_state) {
          console.warn('Invalid row:', data);
          return; // Skip invalid rows
        }

        const ticket = {
          year: parseInt(data.year),
          date: data.date,
          venue: data.venue,
          city_state: data.city_state,
          imageurl: data.imageUrl || '', // Note: column name might be imageUrl or imageurl
          net_link: data.net_link || ''
        };
        results.push(ticket);
      })
      .on('end', () => {
        console.log(`Parsed ${results.length} valid tickets`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });

    parser.write(csvData);
    parser.end();
  });
};

// Function to convert JSON to CSV
const convertJsonToCsv = async (tickets) => {
  const csvWriter = createObjectCsvWriter({
    path: CSV_FILE_PATH,
    header: [
      { id: 'year', title: 'year' },
      { id: 'date', title: 'date' },
      { id: 'venue', title: 'venue' },
      { id: 'city_state', title: 'city_state' },
      { id: 'imageUrl', title: 'imageUrl' },
      { id: 'net_link', title: 'net_link' }
    ]
  });

  const records = tickets.map(ticket => ({
    year: new Date(ticket.date).getFullYear(),
    date: ticket.date,
    venue: ticket.venue,
    city_state: ticket.city_state,
    imageUrl: ticket.imageUrl,
    net_link: ticket.net_link
  }));

  await csvWriter.writeRecords(records);
  return fs.readFileSync(CSV_FILE_PATH);
};

// Function to handle CSV upload
const handleCsvUpload = async (csvData) => {
  try {
    console.log('Starting CSV upload process');
    const tickets = await convertCsvToJson(csvData);
    
    if (!tickets || tickets.length === 0) {
      console.error('No valid tickets found in CSV');
      return { success: false, message: 'No valid tickets found in CSV' };
    }

    console.log(`Attempting to insert ${tickets.length} tickets`);

    // Clear the Supabase table
    const { error: deleteError } = await supabase
      .from('ticket_stubs')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('Error clearing Supabase table:', deleteError);
      return { success: false, message: 'Error clearing Supabase table', error: deleteError.message };
    }

    // Insert tickets in batches of 50
    const batchSize = 50;
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = tickets.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('ticket_stubs')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i/batchSize + 1}:`, insertError);
        return { 
          success: false, 
          message: 'Error inserting tickets into Supabase', 
          error: insertError.message,
          failedAt: i
        };
      }
      console.log(`Successfully inserted batch ${i/batchSize + 1}`);
    }

    return { 
      success: true, 
      message: `Successfully uploaded ${tickets.length} tickets` 
    };
  } catch (error) {
    console.error('Error in handleCsvUpload:', error);
    return { 
      success: false, 
      message: 'Error processing CSV file',
      error: error.message
    };
  }
};

// Function to handle CSV download
const handleCsvDownload = async () => {
  try {
    // Fetch tickets from Supabase
    const { data: tickets, error } = await supabase
      .from('ticket_stubs')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching tickets from Supabase:', error);
      return { success: false, message: 'Error fetching tickets from database' };
    }

    const csvData = await convertJsonToCsv(tickets);
    return { success: true, data: csvData };
  } catch (error) {
    console.error('Error generating CSV:', error);
    return { success: false, message: 'Error generating CSV file' };
  }
};

module.exports = {
  handleCsvUpload,
  handleCsvDownload
}; 