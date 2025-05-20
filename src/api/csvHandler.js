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
    let headerSeen = false;
    
    const parser = csv({
      mapValues: ({ header, value }) => {
        if (!headerSeen) {
          console.log('CSV Headers:', header);
          headerSeen = true;
        }
        return value.trim();
      }
    })
    .on('data', (data) => {
      console.log('Processing row:', data);
      
      // Validate required fields
      const missingFields = [];
      if (!data.year) missingFields.push('year');
      if (!data.date) missingFields.push('date');
      if (!data.venue) missingFields.push('venue');
      if (!data.city_state) missingFields.push('city_state');

      if (missingFields.length > 0) {
        console.warn('Invalid row - missing fields:', missingFields, 'Data:', data);
        return; // Skip invalid rows
      }

      // Handle both imageUrl and imageurl cases
      const imageUrl = data.imageUrl || data.imageurl || data.image_url || '';
      const netLink = data.net_link || data.netLink || data.netlink || '';

      const ticket = {
        year: parseInt(data.year),
        date: data.date,
        venue: data.venue,
        city_state: data.city_state,
        imageurl: imageUrl,
        net_link: netLink
      };

      // Validate the parsed data
      if (isNaN(ticket.year)) {
        console.warn('Invalid year format:', data.year);
        return;
      }

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

    // Handle potential parsing errors
    try {
      parser.write(csvData);
      parser.end();
    } catch (error) {
      console.error('Error writing to CSV parser:', error);
      reject(error);
    }
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
    if (!csvData) {
      return { success: false, message: 'No CSV data provided' };
    }

    console.log('Starting CSV upload process');
    console.log('CSV data preview:', csvData.substring(0, 200));

    const tickets = await convertCsvToJson(csvData);
    
    if (!tickets || tickets.length === 0) {
      console.error('No valid tickets found in CSV');
      return { success: false, message: 'No valid tickets found in CSV' };
    }

    console.log(`Attempting to insert ${tickets.length} tickets`);
    console.log('First ticket sample:', tickets[0]);

    // Clear the Supabase table
    const { error: deleteError } = await supabase
      .from('ticket_stubs')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('Error clearing Supabase table:', deleteError);
      return { 
        success: false, 
        message: 'Error clearing Supabase table', 
        error: deleteError.message,
        details: deleteError
      };
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
          details: insertError,
          failedAt: i,
          sampleData: batch[0]
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
      error: error.message,
      stack: error.stack
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