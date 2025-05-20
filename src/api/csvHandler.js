const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const { Readable } = require('stream');

// Use consistent environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
  throw new Error('Missing required Supabase environment variables. Check your environment configuration.');
}

console.log('Initializing Supabase client with:', {
  urlExists: !!supabaseUrl,
  keyPrefix: supabaseKey ? supabaseKey.substring(0, 5) : 'missing'
});

const supabase = createClient(supabaseUrl, supabaseKey);

// Required headers for the CSV file
const requiredHeaders = ['year', 'date', 'venue', 'city_state'];

// Function to validate a single ticket record
const validateTicket = (ticket) => {
  const errors = [];
  
  // Check required fields
  if (!ticket.year) errors.push('Missing year');
  if (!ticket.date) errors.push('Missing date');
  if (!ticket.venue) errors.push('Missing venue');
  if (!ticket.city_state) errors.push('Missing city_state');
  
  // Validate year format
  if (ticket.year && (!Number.isInteger(Number(ticket.year)) || ticket.year.length !== 4)) {
    errors.push('Invalid year format (should be YYYY)');
  }
  
  // Validate date format (YYYY-MM-DD)
  if (ticket.date && !/^\d{4}-\d{2}-\d{2}$/.test(ticket.date)) {
    errors.push('Invalid date format (should be YYYY-MM-DD)');
  }
  
  return errors;
};

// Function to convert CSV to JSON
const convertCsvToJson = (csvData) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let headerSeen = false;
    let headers = [];
    let lineNumber = 0;
    
    // Create a readable stream from the CSV string
    const stream = Readable.from([csvData]);
    
    stream
      .pipe(csv({
        mapValues: ({ header, value }) => {
          if (!headerSeen) {
            console.log('CSV Headers:', header);
            headers = header.map(h => h.toLowerCase());
            
            // Validate required headers
            const missingHeaders = requiredHeaders.filter(h => 
              !headers.includes(h) && 
              !headers.includes(h.replace('_', '')) && 
              !headers.includes(h.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase())
            );
            
            if (missingHeaders.length > 0) {
              throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
            }
            headerSeen = true;
          }
          return value.trim();
        }
      }))
      .on('data', (data) => {
        lineNumber++;
        // Convert all keys to lowercase for consistency
        const ticket = Object.keys(data).reduce((acc, key) => {
          acc[key.toLowerCase()] = data[key];
          return acc;
        }, {});

        // Validate the ticket
        const validationErrors = validateTicket(ticket);
        if (validationErrors.length > 0) {
          throw new Error(`Validation errors on line ${lineNumber}: ${validationErrors.join(', ')}`);
        }

        results.push(ticket);
      })
      .on('end', () => {
        if (results.length === 0) {
          reject(new Error('No valid tickets found in CSV file. Please check the data format.'));
          return;
        }
        console.log(`Parsed ${results.length} valid tickets`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
};

// Function to convert JSON to CSV string
const convertJsonToCsv = async (tickets) => {
  const header = 'year,date,venue,city_state,imageurl,net_link\n';
  const rows = tickets.map(ticket => {
    return [
      ticket.year,
      ticket.date,
      `"${ticket.venue.replace(/"/g, '""')}"`,
      `"${ticket.city_state.replace(/"/g, '""')}"`,
      `"${(ticket.imageurl || '').replace(/"/g, '""')}"`,
      `"${(ticket.net_link || '').replace(/"/g, '""')}"`
    ].join(',');
  });
  return header + rows.join('\n');
};

// Function to handle CSV upload
const handleCsvUpload = async (csvData) => {
  try {
    if (!csvData) {
      return { success: false, message: 'No CSV data provided' };
    }

    console.log('Starting CSV upload process');
    console.log('CSV data preview:', csvData.substring(0, 200));

    // Test Supabase connection before proceeding
    try {
      const { data: testData, error: testError } = await supabase
        .from('ticket_stubs')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        return {
          success: false,
          message: 'Failed to connect to Supabase',
          error: testError.message,
          details: {
            code: testError.code,
            hint: testError.hint,
            details: testError.details
          }
        };
      }
      console.log('Supabase connection test successful');
    } catch (testError) {
      console.error('Supabase connection test threw error:', testError);
      return {
        success: false,
        message: 'Failed to connect to Supabase',
        error: testError.message
      };
    }

    let tickets;
    try {
      tickets = await convertCsvToJson(csvData);
    } catch (parseError) {
      console.error('Error parsing CSV:', parseError);
      return {
        success: false,
        message: 'Error parsing CSV file',
        error: parseError.message
      };
    }
    
    if (!tickets || tickets.length === 0) {
      console.error('No valid tickets found in CSV');
      return { 
        success: false, 
        message: 'No valid tickets found in CSV. Please check that your file contains the required columns and valid data.' 
      };
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
        details: {
          code: deleteError.code,
          hint: deleteError.hint,
          details: deleteError.details
        }
      };
    }

    console.log('Successfully cleared existing records');

    // Insert tickets in batches of 50
    const batchSize = 50;
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = tickets.slice(i, i + batchSize);
      console.log(`Inserting batch ${i/batchSize + 1} with first record:`, batch[0]);
      
      const { error: insertError } = await supabase
        .from('ticket_stubs')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i/batchSize + 1}:`, insertError);
        return { 
          success: false, 
          message: 'Error inserting tickets into Supabase', 
          error: insertError.message,
          details: {
            code: insertError.code,
            hint: insertError.hint,
            details: insertError.details,
            batchIndex: i,
            batchSize: batchSize,
            sampleRecord: batch[0]
          }
        };
      }
    }

    return { 
      success: true, 
      message: `Successfully uploaded ${tickets.length} tickets` 
    };
  } catch (error) {
    console.error('Error in handleCsvUpload:', error);
    return { 
      success: false, 
      message: 'Error processing CSV upload',
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