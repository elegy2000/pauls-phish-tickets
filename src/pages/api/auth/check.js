import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parse(req.headers.cookie || '');
  const session = cookies.admin_session;

  if (session === 'authenticated') {
    return res.status(200).json({ authenticated: true });
  }

  return res.status(401).json({ authenticated: false });
} 