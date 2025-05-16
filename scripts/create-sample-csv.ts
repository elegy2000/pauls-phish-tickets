import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

interface PhishShow {
  year: number;
  date: string;
  venue: string;
  city_state: string;
  net_link: string;
}

async function createSampleData(): Promise<PhishShow[]> {
  // Create sample data based on the Phish.net tour information
  return [
    { 
      year: 2023, 
      date: "August 4, 2023", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-august-04-2023-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 2023, 
      date: "August 5, 2023", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-august-05-2023-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 2023, 
      date: "August 6, 2023", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-august-06-2023-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 2023, 
      date: "April 20, 2023", 
      venue: "Climate Pledge Arena", 
      city_state: "Seattle, WA", 
      net_link: "https://phish.net/setlists/phish-april-20-2023-climate-pledge-arena-seattle-wa-usa.html" 
    },
    { 
      year: 2023, 
      date: "April 21, 2023", 
      venue: "Climate Pledge Arena", 
      city_state: "Seattle, WA", 
      net_link: "https://phish.net/setlists/phish-april-21-2023-climate-pledge-arena-seattle-wa-usa.html" 
    },
    { 
      year: 2023, 
      date: "April 22, 2023", 
      venue: "Climate Pledge Arena", 
      city_state: "Seattle, WA", 
      net_link: "https://phish.net/setlists/phish-april-22-2023-climate-pledge-arena-seattle-wa-usa.html" 
    },
    { 
      year: 2022, 
      date: "December 31, 2022", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-31-2022-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 2022, 
      date: "December 30, 2022", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-30-2022-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 2022, 
      date: "December 29, 2022", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-29-2022-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 2022, 
      date: "December 28, 2022", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-28-2022-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 1997, 
      date: "December 31, 1997", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-31-1997-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 1997, 
      date: "December 30, 1997", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-30-1997-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 1997, 
      date: "December 29, 1997", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-29-1997-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 1997, 
      date: "November 22, 1997", 
      venue: "Hampton Coliseum", 
      city_state: "Hampton, VA", 
      net_link: "https://phish.net/setlists/phish-november-22-1997-hampton-coliseum-hampton-va-usa.html" 
    },
    { 
      year: 1997, 
      date: "November 21, 1997", 
      venue: "Hampton Coliseum", 
      city_state: "Hampton, VA", 
      net_link: "https://phish.net/setlists/phish-november-21-1997-hampton-coliseum-hampton-va-usa.html" 
    },
    { 
      year: 1995, 
      date: "December 31, 1995", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-31-1995-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 1995, 
      date: "December 30, 1995", 
      venue: "Madison Square Garden", 
      city_state: "New York, NY", 
      net_link: "https://phish.net/setlists/phish-december-30-1995-madison-square-garden-new-york-ny-usa.html" 
    },
    { 
      year: 1995, 
      date: "December 14, 1995", 
      venue: "Broome County Veterans Memorial Arena", 
      city_state: "Binghamton, NY", 
      net_link: "https://phish.net/setlists/phish-december-14-1995-broome-county-veterans-memorial-arena-binghamton-ny-usa.html" 
    },
    { 
      year: 1995, 
      date: "October 31, 1995", 
      venue: "Rosemont Horizon", 
      city_state: "Rosemont, IL", 
      net_link: "https://phish.net/setlists/phish-october-31-1995-rosemont-horizon-rosemont-il-usa.html" 
    },
    { 
      year: 1994, 
      date: "June 18, 1994", 
      venue: "UIC Pavilion", 
      city_state: "Chicago, IL", 
      net_link: "https://phish.net/setlists/phish-june-18-1994-uic-pavilion-chicago-il-usa.html" 
    },
    { 
      year: 1994, 
      date: "June 17, 1994", 
      venue: "Eagle Lake Country Club", 
      city_state: "Eagle Lake, MN", 
      net_link: "https://phish.net/setlists/phish-june-17-1994-eagle-lake-country-club-eagle-lake-mn-usa.html" 
    },
    { 
      year: 1994, 
      date: "April 5, 1994", 
      venue: "The Gin Mill", 
      city_state: "Athens, GA", 
      net_link: "https://phish.net/setlists/phish-april-05-1994-the-georgia-theatre-athens-ga-usa.html" 
    },
    { 
      year: 1993, 
      date: "December 31, 1993", 
      venue: "The Worcester Centrum", 
      city_state: "Worcester, MA", 
      net_link: "https://phish.net/setlists/phish-december-31-1993-the-worcester-centrum-centre-worcester-ma-usa.html" 
    },
    { 
      year: 1993, 
      date: "August 17, 1993", 
      venue: "Crystal Bay Club Casino", 
      city_state: "Lake Tahoe, NV", 
      net_link: "https://phish.net/setlists/phish-august-17-1993-crystal-bay-club-casino-lake-tahoe-nv-usa.html" 
    },
    { 
      year: 1993, 
      date: "August 16, 1993", 
      venue: "The Greek Theatre", 
      city_state: "Berkeley, CA", 
      net_link: "https://phish.net/setlists/phish-august-16-1993-william-randolph-hearst-greek-theatre-berkeley-ca-usa.html" 
    },
    { 
      year: 1993, 
      date: "August 14, 1993", 
      venue: "World Music Theatre", 
      city_state: "Tinley Park, IL", 
      net_link: "https://phish.net/setlists/phish-august-14-1993-world-music-theatre-tinley-park-il-usa.html" 
    },
    { 
      year: 1993, 
      date: "August 13, 1993", 
      venue: "Murat Theatre", 
      city_state: "Indianapolis, IN", 
      net_link: "https://phish.net/setlists/phish-august-13-1993-murat-theatre-indianapolis-in-usa.html" 
    },
    { 
      year: 1993, 
      date: "August 12, 1993", 
      venue: "Star Lake Amphitheatre", 
      city_state: "Burgettstown, PA", 
      net_link: "https://phish.net/setlists/phish-august-12-1993-star-lake-amphitheatre-burgettstown-pa-usa.html" 
    },
    { 
      year: 1993, 
      date: "August 11, 1993", 
      venue: "Darien Lake Performing Arts Center", 
      city_state: "Darien Center, NY", 
      net_link: "https://phish.net/setlists/phish-august-11-1993-darien-lake-performing-arts-center-darien-center-ny-usa.html" 
    },
  ];
}

async function main() {
  try {
    // Create sample data
    const shows = await createSampleData();
    console.log(`Created ${shows.length} sample show entries`);
    
    // Create the data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      console.log('Data directory already exists');
    }
    
    // Write shows to CSV
    const csvWriter = createObjectCsvWriter({
      path: path.join(dataDir, 'phish_tours.csv'),
      header: [
        { id: 'year', title: 'year' },
        { id: 'date', title: 'date' },
        { id: 'venue', title: 'venue' },
        { id: 'city_state', title: 'city_state' },
        { id: 'net_link', title: 'net_link' }
      ]
    });
    
    await csvWriter.writeRecords(shows);
    console.log(`CSV file created with ${shows.length} shows`);
    
    // Write shows to JSON
    const jsonPath = path.join(dataDir, 'phish_tours.json');
    await fs.writeFile(jsonPath, JSON.stringify({ shows }, null, 2));
    console.log(`JSON file created at ${jsonPath}`);
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

main(); 