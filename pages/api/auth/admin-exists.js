import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    return res.status(500).json({ error: 'Failed to list users' });
  }
  const exists = users.users.some(u => u.email === 'windows.rift05@icloud.com');
  return res.status(200).json({ exists });
} 