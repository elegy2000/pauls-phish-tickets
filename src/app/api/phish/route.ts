import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const DATA_FILE = path.join(process.cwd(), 'public/data/phish_tours.csv');

export async function GET() {
  try {
    const csvData = fs.readFileSync(DATA_FILE, 'utf8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });

    // Extract unique years and format data
    const years = [...new Set(records.map((record: any) => {
      const year = record.YEAR.split(' ')[0]; // Extract year from "YEAR SEASON" format
      return parseInt(year);
    }))];

    return NextResponse.json({
      years,
      shows: records
    });
  } catch (error) {
    console.error('Error reading Phish tour data:', error);
    return NextResponse.json({ error: 'Failed to read Phish tour data' }, { status: 500 });
  }
} 