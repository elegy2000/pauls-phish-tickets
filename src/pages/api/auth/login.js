import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Replace these with your actual admin credentials
  // In production, use environment variables and proper password hashing
  if (username === 'admin' && password === 'your-secure-password') {
    // Set a session cookie
    res.setHeader('Set-Cookie', serialize('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    }));

    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
} 