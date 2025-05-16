const fs = require('fs/promises');
const path = require('path');

interface Show {
  date: string;
  venue: string;
  location: string;
  imageUrl: string;
  netLink: string;
  tour?: string;
}

async function combineTourData() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const files: string[] = await fs.readdir(dataDir);
    const tourFiles = files.filter((file: string) => file.endsWith('_tour.json'));
    
    let allShows: Show[] = [];
    
    for (const file of tourFiles) {
      const filePath = path.join(dataDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          allShows = allShows.concat(data);
        } else if (data.shows && Array.isArray(data.shows)) {
          allShows = allShows.concat(data.shows);
        }
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
      }
    }
    
    // Deduplicate shows based on date and location
    const uniqueShows = allShows.reduce((acc: Show[], show) => {
      const key = `${show.date}-${show.location}`;
      const existingShow = acc.find(s => `${s.date}-${s.location}` === key);
      
      if (!existingShow) {
        acc.push(show);
      } else if (!existingShow.venue.startsWith('Phish') && show.venue.startsWith('Phish')) {
        // Replace the show if the existing one doesn't have the "Phish" prefix but the new one does
        const index = acc.indexOf(existingShow);
        acc[index] = show;
      }
      
      return acc;
    }, []);
    
    // Sort shows by date
    uniqueShows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Create CSV content
    const csvHeader = 'YEAR\tDate\tVENUE\t"CITY, ST"\tTicket Stub Image\t.net link\n';
    const csvRows = uniqueShows.map(show => {
      const year = new Date(show.date).getFullYear();
      // Extract just the month and day from the date
      const dateParts = show.date.split(',')[0];
      return `${year}\t${dateParts}\t"${show.venue}"\t"${show.location}"\t/images/ticket-stubs/${show.date.replace(/,/g, '').replace(/\s+/g, '-').toLowerCase()}.jpg\t${show.netLink}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Write CSV file
    await fs.writeFile(
      path.join(dataDir, 'phish_tours.csv'),
      csvContent,
      'utf-8'
    );
    
    // Write combined JSON file
    await fs.writeFile(
      path.join(dataDir, 'all_shows.json'),
      JSON.stringify({ shows: uniqueShows }, null, 2),
      'utf-8'
    );
    
    console.log(`Successfully processed ${uniqueShows.length} unique shows`);
    console.log('Updated phish_tours.csv and all_shows.json');
    
  } catch (error) {
    console.error('Error combining tour data:', error);
    process.exit(1);
  }
}

combineTourData(); 