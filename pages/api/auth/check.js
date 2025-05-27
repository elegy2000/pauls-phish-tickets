import { parse } from 'cookie';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Add CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? 'https://pauls-phish-tickets-c7fzdozli-elegy2000s-projects.vercel.app' 
    : 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  setCorsHeaders(res);

  try {
    const cookies = parse(req.headers.cookie || '');
    const access_token = cookies['sb-access-token'];

    if (!access_token) {
      return res.status(401).json({ authenticated: false });
    }

    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data.user || data.user.email !== 'windows.rift05@icloud.com') {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({ authenticated: true });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 