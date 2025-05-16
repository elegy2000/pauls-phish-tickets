// Simple authentication middleware
export function withAuth(handler) {
  return async (req, res) => {
    // In a real application, you would implement proper authentication
    // This is a simple example using a basic password check
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Replace these with your actual admin credentials
    // In production, use environment variables and proper password hashing
    if (username !== 'admin' || password !== 'your-secure-password') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return handler(req, res);
  };
} 