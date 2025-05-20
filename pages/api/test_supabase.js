// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// Test auto-deployment trigger
export default function handler(req, res) {
  // Log request details
  console.log('API Route Hit:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return a simple response
    return res.status(200).json({
      success: true,
      message: 'API endpoint is working',
      supabaseUrlExists: !!process.env.SUPABASE_URL,
      supabaseKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test_supabase:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
} 