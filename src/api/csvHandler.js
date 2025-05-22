const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const { Readable } = require('stream');

// Use consistent environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
  throw new Error('Missing required Supabase environment variables. Check your environment configuration.');
}

console.log('Initializing Supabase client with:', {
  urlExists: !!supabaseUrl,
  serviceKeyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 5) : 'missing'
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Function to convert CSV data to JSON
const convertCsvToJson = (csvData) => {
  return new Promise((resolve, reject) => {
    const tickets = [];
    const errors = [];
    let headerValidated = false;
    let lineNumber = 0;

    const stream = Readable.from(csvData)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase()
      }));

    stream.on('headers', (headers) => {
      lineNumber = 1;
      const missingHeaders = requiredHeaders.filter(
        required => !headers.map(h => h.trim().toLowerCase()).includes(required)
      );

      if (missingHeaders.length > 0) {
        reject(new Error(
          `Missing required headers: ${missingHeaders.join(', ')}. ` +
          `Required headers are: ${requiredHeaders.join(', ')}`
        ));
      }
      headerValidated = true;
    });

    stream.on('data', (row) => {
      lineNumber++;
      // Clean up the data
      Object.keys(row).forEach(key => {
        row[key] = row[key].trim();
      });

      // Defensive: skip header row or any row where year is not a 4-digit integer
      if (!/^\d{4}$/.test(row.year)) {
        errors.push(`Line ${lineNumber}: Skipped row with invalid year: ${row.year}`);
        return;
      }

      const validationErrors = validateTicket(row);
      if (validationErrors.length > 0) {
        errors.push(`Line ${lineNumber}: ${validationErrors.join(', ')}`);
      } else {
        tickets.push({
          year: Number(row.year),
          date: row.date,
          venue: row.venue,
          city_state: row.city_state,
          imageurl: row.imageurl || row.image_url || '',
          net_link: row.net_link || ''
        });
      }
    });

    stream.on('end', () => {
      if (errors.length > 0) {
        reject(new Error(`Validation errors found:\n${errors.join('\n')}`));
      } else {
        // Deduplicate tickets by date (only keep the first occurrence of each date)
        const seenDates = new Set();
        const dedupedTickets = [];
        for (const ticket of tickets) {
          if (!seenDates.has(ticket.date)) {
            dedupedTickets.push(ticket);
            seenDates.add(ticket.date);
          }
        }
        resolve(dedupedTickets);
      }
    });

    stream.on('error', (error) => {
      reject(new Error(`Error parsing CSV: ${error.message}`));
    });
  });
};

// Function to convert JSON to CSV
const convertJsonToCsv = (tickets) => {
  if (!tickets || tickets.length === 0) {
    return 'year,date,venue,city_state,imageurl,net_link\n';
  }

  const headers = ['year', 'date', 'venue', 'city_state', 'imageurl', 'net_link'];
  const rows = tickets.map(ticket => {
    return [
      ticket.year || '',
      ticket.date || '',
      ticket.venue || '',
      ticket.city_state || '',
      ticket.imageurl || '',
      ticket.net_link || ''
    ].map(value =>
      value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
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

    // Clear the Supabase table (delete all rows)
    const { count: deletedCount, error: deleteError } = await supabase
      .from('ticket_stubs')
      .delete({ count: 'exact' })
      .neq('id', null);
    console.log('Deleted rows before CSV upload:', deletedCount);
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
      console.log(`Inserting batch ${i/batchSize + 1} of ${Math.ceil(tickets.length/batchSize)}:`, {
        batchSize: batch.length,
        firstRecord: batch[0],
        lastRecord: batch[batch.length - 1]
      });
      
      const { error: insertError } = await supabase
        .from('ticket_stubs')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i/batchSize + 1}:`, {
          error: insertError,
          errorCode: insertError.code,
          errorMessage: insertError.message,
          errorDetails: insertError.details,
          batchSize: batch.length,
          sampleRecord: batch[0]
        });
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
      message: 'Error processing CSV upload',
      error: error.message
    };
  }
};

// Function to handle CSV download
const handleCsvDownload = async () => {
  try {
    // Fetch all tickets in batches of 1000
    let allTickets = [];
    let batchIndex = 0;
    const batchSize = 1000;
    while (true) {
      const { data: tickets, error } = await supabase
        .from('ticket_stubs')
        .select('*')
        .order('date', { ascending: false })
        .range(batchIndex * batchSize, (batchIndex + 1) * batchSize - 1);
      if (error) {
        console.error('Error fetching tickets from Supabase:', error);
        return { success: false, message: 'Error fetching tickets from database' };
      }
      if (!tickets || tickets.length === 0) break;
      allTickets = allTickets.concat(tickets);
      if (tickets.length < batchSize) break;
      batchIndex++;
    }

    const csvData = await convertJsonToCsv(allTickets);
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