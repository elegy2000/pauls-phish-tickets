# Paul's Phish Tickets Archive

A Next.js application showcasing an archive of Phish concert tickets with data scraped from Phish.net.

## Features

- Browse Phish shows by year and tour
- View detailed information about venues, dates, and locations
- Responsive design for desktop and mobile viewing
- Data includes shows from 1983 to present

## Live Demo

Visit the live site: [Paul's Phish Tickets Archive](https://yourusername.github.io/pauls-phish-tickets)

## Setup

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server

## Deployment

This site is deployed using GitHub Pages. To deploy your own version:

1. Fork this repository
2. Update the repository settings to enable GitHub Pages
3. The site will be available at `https://yourusername.github.io/pauls-phish-tickets`

## Data Sources

The data for this project is scraped from Phish.net using various scripts:

- Comprehensive show information from 1983 to present
- Tour information and classifications
- Venue details and locations

## Features

- Scrapes all Phish shows from 1983 to present
- Data includes year, date, venue, city/state, and link to show on Phish.net
- Generates both CSV and JSON formats
- Includes error handling and retry mechanisms
- Respects rate limits to avoid being blocked

## Setup

1. Clone this repository
2. Run `npm install` to install dependencies

## Running the Scraper

To run the comprehensive scraper that fetches all Phish shows:

```bash
npm run comprehensive-scrape
```

This will create two files in the `data` directory:
- `phish_tours_comprehensive.csv` - CSV file with all shows
- `phish_tours_comprehensive.json` - JSON file with all shows

The scraper includes a resume feature, so if it's interrupted, you can run it again and it will pick up where it left off.

## File Structure

- `scripts/comprehensive-scraper.ts` - Main scraper script
- `data/` - Output directory for CSV and JSON files

## Notes

- The scraper respects rate limits by waiting between requests
- It includes retry logic to handle temporary errors
- Shows are sorted by date in the output files
- For years beyond the current year, only announced future shows will be included

## Other Scripts

- `npm run create-sample-csv` - Creates a sample CSV with selected notable shows
- `npm run scrape-phish-shows` - Alternative scraper with different approach
- `npm run scrape-phish-data` - Another alternative scraper
- `npm run fetch-phish-csv` - Fetch data using CSV format
- `npm run fetch-tour-csv` - Fetch tour data in CSV format
- `npm run test-api` - Test the Phish.net API
- `npm run update-site-data` - Update site data

## Data Overview

The scraper has collected information for 587 Phish shows across the following tours:
- 1983 Tour (2 shows)
- 1984 Tour (3 shows)
- 1985 Tour (28 shows)
- 1986 Tour (19 shows)
- 1987 Tour (42 shows)
- 1988 Tour (95 shows)
- 1989 Tour (128 shows, expected 128)
- 1990 Tour (147 shows)
- 1991 Fall Tour (49 shows)
- 1991 Giant Country Horns Summer Tour (14 shows)
- 1991 Winter/Spring Tour (63 shows)

## Usage

1. Install dependencies:
```
npm install
```

2. Run the scraper:
```
npm run dev
```

3. Output data will be saved to:
- `data/phish_tours.csv`: CSV file with all show data
- `data/all_shows.json`: JSON file with all show data
- Individual tour JSON files (e.g., `data/1983_tour.json`)

## Data Format

The CSV file has the following columns:
- `YEAR`: The tour year (e.g., "1983", "1991 Winter")
- `Date`: Formatted date (e.g., "December 2, 1983")
- `VENUE`: Venue name (e.g., "Harris-Millis Cafeteria - University Of Vermont")
- `CITY, ST`: City and state (e.g., "Burlington, VT")
- `imageUrl`: Placeholder image URL
- `.net link`: Link to the show's page on phish.net

## Notes

- The scraper extracts data from the HTML structure of phish.net tour pages.
- It uses the URL structure and text content to determine venue and location information.
- Due to inconsistencies in the source data, there might be minor inaccuracies in the venue/location parsing.
- The script includes a delay between requests to be respectful to the phish.net server.

## File Uploads

This application supports file uploads through GitHub integration. When running on Vercel's serverless environment, all file uploads are stored in the GitHub repository to ensure data persistence. 