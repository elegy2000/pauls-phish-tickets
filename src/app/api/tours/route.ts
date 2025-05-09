import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    // Read the tours data
    const toursPath = path.join(process.cwd(), 'public/data/tours.json');
    const toursData = JSON.parse(fs.readFileSync(toursPath, 'utf8'));
    
    if (year) {
      // Filter tours by year if year parameter is provided
      const yearTours = toursData.tours.filter((tour: any) => tour.year === year);
      return NextResponse.json({ tours: yearTours });
    }
    
    // Return all tours if no year parameter
    return NextResponse.json(toursData);
  } catch (error) {
    console.error('Error fetching tours:', error);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
} 