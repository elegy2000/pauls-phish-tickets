import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ error: 'Year parameter is required' });
    }

    // Read the data from the tickets.json file (always fresh)
    const dataPath = path.join(process.cwd(), 'public', 'data', 'tickets.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);

    // Filter tickets for the requested year
    const filteredShows = data.tickets.filter(show => {
      return show.year && show.year.toString() === year;
    });

    // Map net_link to netLink for each show
    const showsWithCamelCase = filteredShows.map(show => ({
      ...show,
      netLink: show.net_link,
    }));

    return res.status(200).json({ shows: showsWithCamelCase });
  } catch (error) {
    console.error('Error processing shows request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 