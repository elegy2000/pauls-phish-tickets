import { createClient } from '@supabase/supabase-js';

// Use the service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('Create admin API called:', { method: req.method, hasEmail: !!req.body?.email, hasPassword: !!req.body?.password, hasSecret: !!req.body?.secret });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, secret } = req.body;
  const expectedSecret = process.env.ADMIN_CREATE_SECRET || 'temp-admin-setup-secret-2024';
  console.log('Secret check:', { providedSecret: secret, expectedSecret, match: secret === expectedSecret });
  
  // Require a secret token for security (set this in your env and frontend call)
  if (secret !== expectedSecret) {
    console.log('Secret mismatch, returning 401');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }

  console.log('Checking if admin user already exists...');
  // Check if the admin user already exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return res.status(500).json({ error: 'Failed to list users' });
  }
  console.log('Current users count:', users.users.length);
  const exists = users.users.some(u => u.email === email);
  if (exists) {
    console.log('Admin user already exists');
    return res.status(409).json({ error: 'Admin user already exists' });
  }

  console.log('Creating admin user...');
  // Create the admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message });
  }
  console.log('Admin user created successfully:', data.user.id);
  return res.status(200).json({ success: true, user: data.user });
} 