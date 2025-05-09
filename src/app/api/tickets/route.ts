import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Try multiple possible locations for the data file
const PRIMARY_DATA_FILE = path.join(process.cwd(), 'src/data/tickets.json');
const ALTERNATE_DATA_FILE = path.join(process.cwd(), 'public/data/tickets.json');
const FALLBACK_DATA_FILE = path.join(process.cwd(), 'pauls-ticket-site/src/data/tickets.json');

export async function GET() {
  console.log('API GET /api/tickets called');
  
  try {
    let dataFile = PRIMARY_DATA_FILE;
    
    // Check multiple possible locations
    if (fs.existsSync(PRIMARY_DATA_FILE)) {
      console.log(`Using primary data file: ${PRIMARY_DATA_FILE}`);
      dataFile = PRIMARY_DATA_FILE;
    } else if (fs.existsSync(ALTERNATE_DATA_FILE)) {
      console.log(`Using alternate data file: ${ALTERNATE_DATA_FILE}`);
      dataFile = ALTERNATE_DATA_FILE;
    } else if (fs.existsSync(FALLBACK_DATA_FILE)) {
      console.log(`Using fallback data file: ${FALLBACK_DATA_FILE}`);
      dataFile = FALLBACK_DATA_FILE;
    } else {
      console.error('No tickets data file found in any location');
      
      // If no file exists, create a mock response for testing
      const mockData = {
        years: [2019, 2020, 2021, 2022, 2023, 2024],
        tickets: [
          {
            year: 2019,
            date: "July 14, 2019",
            venue: "Alpine Valley Music Theatre",
            city_state: "East Troy, WI",
            imageUrl: "/images/default-show.jpg",
            net_link: "https://phish.net/setlists/phish-july-14-2019-alpine-valley-music-theatre-east-troy-wi-usa.html"
          },
          {
            year: 2019,
            date: "December 31, 2019",
            venue: "Madison Square Garden",
            city_state: "New York, NY",
            imageUrl: "/images/default-show.jpg",
            net_link: "https://phish.net/setlists/phish-december-31-2019-madison-square-garden-new-york-ny-usa.html"
          }
        ]
      };
      
      console.log('Returning mock data for testing');
      return NextResponse.json(mockData);
    }
    
    // Read the data file that exists
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`Successfully read tickets data with ${data.tickets?.length || 0} tickets`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading tickets data:', error);
    
    // Return empty data structure on error
    return NextResponse.json({ 
      years: [], 
      tickets: [] 
    });
  }
}

export async function POST(request: Request) {
  console.log('API POST /api/tickets called');
  
  try {
    const data = await request.json();
    console.log(`Received data with ${data.tickets?.length || 0} tickets`);
    
    // Ensure the directory exists
    const dir = path.dirname(PRIMARY_DATA_FILE);
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(PRIMARY_DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`Successfully saved tickets data to: ${PRIMARY_DATA_FILE}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving tickets data:', error);
    return NextResponse.json({ error: 'Failed to save tickets data' }, { status: 500 });
  }
} 