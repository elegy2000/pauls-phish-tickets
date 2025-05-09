import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    if (!year) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
    }

    // Read the tours data
    const toursPath = path.join(process.cwd(), 'public/data/tours.json');
    
    // Check if the file exists first
    if (!fs.existsSync(toursPath)) {
      console.error(`File not found: ${toursPath}`);
      return NextResponse.json({ 
        error: 'Tours data file not found',
        message: `Tried to access: ${toursPath}`,
        cwd: process.cwd()
      }, { status: 404 });
    }
    
    const toursData = JSON.parse(fs.readFileSync(toursPath, 'utf8'));
    
    // Filter tours by year
    const yearTours = toursData.tours.filter((tour: any) => tour.year === year);
    
    if (!yearTours.length) {
      return NextResponse.json({ error: `No tours found for ${year}` }, { status: 404 });
    }
    
    // For now, just return mock show data for the selected tour
    return NextResponse.json({ 
      tour: yearTours[0],
      shows: [
        {
          id: '1',
          date: yearTours[0].dates.split(' - ')[0],
          venue: yearTours[0].venues[0],
          city: 'New York',
          state: 'NY',
          setlist: ['Song 1', 'Song 2', 'Song 3'],
          imageUrl: yearTours[0].imageUrl
        },
        {
          id: '2',
          date: yearTours[0].dates.split(' - ')[1] || yearTours[0].dates.split(' - ')[0],
          venue: yearTours[0].venues.length > 1 ? yearTours[0].venues[1] : yearTours[0].venues[0],
          city: 'Boston',
          state: 'MA',
          setlist: ['Song 4', 'Song 5', 'Song 6'],
          imageUrl: yearTours[0].imageUrl
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching shows:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch shows', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 