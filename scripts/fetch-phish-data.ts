import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import PhishNetAPI from '../src/utils/phishnet-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

type FormattedShow = {
  year: string;
  date: string;
  venue: string;
  location: string;
  imageUrl: string;
  netLink: string;
  tour?: string;
};

const API_KEY = process.env.PHISHNET_API_KEY;
if (!API_KEY) {
  console.error('PHISHNET_API_KEY environment variable is not set');
  process.exit(1);
}

const api = new PhishNetAPI(API_KEY);

async function fetchShows() {
  try {
    const allShows = [];
    const years = Array.from({ length: 2024 - 1983 + 1 }, (_, i) => 1983 + i);

    for (let year = 1983; year <= 2024; year++) {
      console.log(`Fetching shows for year ${year}...`);
      const shows = await api.getShowsByYear(year.toString());
      allShows.push(...shows);
      console.log(`Found ${shows.length} shows for ${year}`);
      
      // Save shows for this year
      const yearData = {
        year,
        shows
      };
      await fs.writeFile(
        path.join(process.cwd(), 'public', 'data', `shows_${year}.json`),
        JSON.stringify(yearData, null, 2)
      );
    }

    // Save all shows to a single file
    const allShowsData = {
      shows: allShows
    };
    await fs.writeFile(
      path.join(process.cwd(), 'public', 'data', 'all_shows.json'),
      JSON.stringify(allShowsData, null, 2)
    );
    console.log(`\nSaved all ${allShows.length} shows to all_shows.json`);

  } catch (error) {
    console.error('Error fetching shows:', error);
    process.exit(1);
  }
}

fetchShows(); 