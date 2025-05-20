// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// Test auto-deployment trigger
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Test endpoint working',
    supabaseUrlExists: !!process.env.SUPABASE_URL,
    supabaseKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
} 