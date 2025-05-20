import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Log environment variables (safely)
  console.log('Supabase URL exists:', !!supabaseUrl);
  console.log('Supabase Key exists:', !!supabaseKey);
  console.log('Supabase Key prefix (if exists):', supabaseKey?.substring(0, 6) + '...');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to fetch a single row from ticket_stubs
    const { data, error } = await supabase
      .from('ticket_stubs')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase test error:', error);
      return res.status(500).json({
        success: false,
        message: 'Supabase connection test failed',
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase connection successful',
      hasData: !!data?.length,
      tableExists: true
    });

  } catch (err) {
    console.error('Unexpected error during Supabase test:', err);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error during test',
      error: err.message
    });
  }
} 