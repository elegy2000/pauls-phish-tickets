import { createClient } from '@supabase/supabase-js';

// Use the service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, secret } = req.body;
  // Require a secret token for security (set this in your env and frontend call)
  if (secret !== process.env.ADMIN_CREATE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Check if the admin user already exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    return res.status(500).json({ error: 'Failed to list users' });
  }
  const exists = users.users.some(u => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Admin user already exists' });
  }

  // Create the admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true, user: data.user });
} 