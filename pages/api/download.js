import { handleCsvDownload } from '../../src/api/csvHandler';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const result = await handleCsvDownload();
    
    if (result.success) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=phish_tours.csv');
      res.send(result.data);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in download endpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 