export default async function handler(req, res) {
  // Return a simple response
  res.status(200).json({
    message: 'API endpoint is working',
    supabaseUrlExists: !!process.env.SUPABASE_URL,
    supabaseKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
} 