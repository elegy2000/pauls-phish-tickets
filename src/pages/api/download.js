import { handleCsvDownload } from '../../api/csvHandler';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await handleCsvDownload();
  if (result.success) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=phish_tours.csv');
    res.send(result.data);
  } else {
    res.status(400).json(result);
  }
} 