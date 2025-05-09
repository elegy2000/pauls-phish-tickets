const fs = require('fs');
const path = require('path');

// Read the tour data
const tourData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/tours.json'), 'utf8')).tours;

function generateSampleShowsFromTours() {
  const allShows = [];
  
  // Process each tour
  tourData.forEach(tour => {
    const year = tour.year;
    const tourName = tour.name;
    const showCount = tour.show_count;
    
    // Generate sample shows for each tour (1 sample per tour)
    const yearStr = String(year);
    
    // Determine if this is a seasonal tour
    let seasonPart = '';
    if (tourName.includes('Fall')) {
      seasonPart = ' Fall';
    } else if (tourName.includes('Winter')) {
      seasonPart = ' Winter';
    } else if (tourName.includes('Spring')) {
      seasonPart = ' Spring';
    } else if (tourName.includes('Summer')) {
      seasonPart = ' Summer';
    }
    
    // Default venue and location based on tour name
    let venue = 'Default Venue';
    let location = 'Default Location';
    
    if (tourName.includes('NYE')) {
      venue = 'Madison Square Garden';
      location = 'New York, NY';
    } else if (tourName.includes('Mexico')) {
      venue = 'Moon Palace Resort';
      location = 'Cancún, Mexico';
    } else if (tourName.includes('Summer European Tour')) {
      venue = 'European Venue';
      location = 'Various Cities, Europe';
    } else if (tourName.includes('Fall Tour')) {
      venue = 'Fall Tour Venue';
      location = 'Various Cities, US';
    } else if (tourName.includes('Summer Tour')) {
      venue = 'Summer Tour Venue';
      location = 'Various Cities, US';
    } else if (tourName.includes('Spring Tour')) {
      venue = 'Spring Tour Venue';
      location = 'Various Cities, US';
    } else if (tourName.includes('Winter Tour')) {
      venue = 'Winter Tour Venue';
      location = 'Various Cities, US';
    }
    
    // For each tour, generate sample shows
    for (let i = 0; i < Math.min(showCount, 3); i++) {
      // Generate a sample date for this tour
      let month = 'January';
      if (seasonPart.includes('Fall')) {
        month = 'October';
      } else if (seasonPart.includes('Winter')) {
        month = 'February';
      } else if (seasonPart.includes('Spring')) {
        month = 'April';
      } else if (seasonPart.includes('Summer')) {
        month = 'July';
      } else if (tourName.includes('NYE')) {
        month = 'December';
      }
      
      const day = i + 1;
      const date = `${month} ${day}, ${year}`;
      
      allShows.push({
        year: yearStr + seasonPart,
        date: date,
        venue: venue,
        location: location,
        imageUrl: '/images/2024-07-30-chaifetz-arena.jpg',
        netLink: tour.sample_url
      });
    }
  });
  
  return allShows;
}

// Generate the sample shows
const sampleShows = generateSampleShowsFromTours();

// Combine with existing shows data from the all_shows.json file
let existingShows = [];
try {
  const existingShowsPath = path.join(process.cwd(), 'public/data/all_shows.json');
  if (fs.existsSync(existingShowsPath)) {
    existingShows = JSON.parse(fs.readFileSync(existingShowsPath, 'utf8'));
    console.log(`Read ${existingShows.length} existing shows from all_shows.json`);
  }
} catch (error) {
  console.error('Error reading existing shows:', error);
}

// Get existing years
const existingYears = new Set(existingShows.map(show => show.year.split(' ')[0]));

// Filter out sample shows for years that already exist in the data
const newShows = sampleShows.filter(show => {
  const baseYear = show.year.split(' ')[0];
  return !existingYears.has(baseYear);
});

// Combine shows
const combinedShows = [...existingShows, ...newShows];

// Write the combined shows to the all_shows.json file
const showsFilePath = path.join(process.cwd(), 'public/data/all_shows.json');
fs.writeFileSync(showsFilePath, JSON.stringify(combinedShows, null, 2));
console.log(`Added ${newShows.length} sample shows to all_shows.json (total: ${combinedShows.length})`);

// Run the script
try {
  console.log('Sample show data generation completed. Data saved to public/data/all_shows.json');
} catch (error) {
  console.error('Failed to generate sample show data:', error);
  process.exit(1);
} 