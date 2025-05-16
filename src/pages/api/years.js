import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use the same path as in the csvHandler.js file
    const jsonFilePath = path.join(process.cwd(), '.next/server/pages/data/tickets.json');
    
    if (!fs.existsSync(jsonFilePath)) {
      // Try the src/data path as fallback
      const fallbackPath = path.join(process.cwd(), 'src/data/tickets.json');
      if (fs.existsSync(fallbackPath)) {
        const jsonData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        return res.status(200).json({ years: jsonData.years || [] });
      }
      return res.status(404).json({ error: 'No ticket data found' });
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    res.status(200).json({ years: jsonData.years || [] });
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
} 