// Simple test endpoint matching server_info.js pattern
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Supabase test endpoint',
    env: {
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
} 