const fs = require('fs');
const path = require('path');

// Complete tour data from the user's request
const tourData = [
  { name: "1983 Tour", shows: 2 },
  { name: "1984 Tour", shows: 3 },
  { name: "1985 Tour", shows: 28 },
  { name: "1986 Tour", shows: 19 },
  { name: "1987 Tour", shows: 42 },
  { name: "1988 Tour", shows: 95 },
  { name: "1989 Tour", shows: 128 },
  { name: "1990 Tour", shows: 147 },
  { name: "1991 Fall Tour", shows: 49 },
  { name: "1991 Giant Country Horns Summer Tour", shows: 14 },
  { name: "1991 Winter/Spring Tour", shows: 63 },
  { name: "1992 Fall Tour", shows: 21 },
  { name: "1992 NYE Run", shows: 4 },
  { name: "1992 Spring Tour", shows: 54 },
  { name: "1992 Summer European Tour", shows: 8 },
  { name: "1992 Summer U.S. Tour", shows: 34 },
  { name: "1993 NYE Run", shows: 4 },
  { name: "1993 Summer Tour", shows: 33 },
  { name: "1993 Winter/Spring Tour", shows: 71 },
  { name: "1994 Fall Tour", shows: 46 },
  { name: "1994 NYE Run", shows: 4 },
  { name: "1994 Spring Tour", shows: 44 },
  { name: "1994 Summer Tour", shows: 29 },
  { name: "1995 Fall Tour", shows: 54 },
  { name: "1995 NYE Run", shows: 4 },
  { name: "1995 Summer Tour", shows: 22 },
  { name: "1996 Fall Tour", shows: 35 },
  { name: "1996 NYE Run", shows: 4 },
  { name: "1996 Summer European Tour", shows: 18 },
  { name: "1996 Summer U.S. Tour", shows: 12 },
  { name: "1997 Fall Tour (a.k.a. Phish Destroys America)", shows: 21 },
  { name: "1997 NYE Run", shows: 4 },
  { name: "1997 Summer European Tour", shows: 19 },
  { name: "1997 Summer U.S. Tour", shows: 19 },
  { name: "1997 Winter European Tour", shows: 14 },
  { name: "1998 Fall Tour", shows: 22 },
  { name: "1998 Island Tour", shows: 4 },
  { name: "1998 NYE Run", shows: 4 },
  { name: "1998 Summer U.S. Tour", shows: 23 },
  { name: "1998 Summer European Tour", shows: 9 },
  { name: "1999 Fall Tour", shows: 24 },
  { name: "1999 Summer U.S. Tour", shows: 20 },
  { name: "1999 Summer Japan Tour", shows: 4 },
  { name: "1999 Winter Tour", shows: 14 },
  { name: "2000 Fall Tour", shows: 21 },
  { name: "2000 NYC Tour", shows: 3 },
  { name: "2000 Summer Japan Tour", shows: 7 },
  { name: "2000 Summer U.S. Tour", shows: 18 },
  { name: "2002/2003 Inverted NYE Run", shows: 4 },
  { name: "2003 20th Anniversary Run", shows: 4 },
  { name: "2003 NYE Run", shows: 4 },
  { name: "2003 Summer Tour", shows: 21 },
  { name: "2003 Winter Tour", shows: 12 },
  { name: "2004 Early Summer Tour", shows: 8 },
  { name: "2004 Late Summer Tour", shows: 7 },
  { name: "2004 Vegas Run", shows: 3 },
  { name: "2009 Fall Tour", shows: 13 },
  { name: "2009 Hampton Reunion Run", shows: 3 },
  { name: "2009 NYE Run", shows: 4 },
  { name: "2009 Early Summer Tour", shows: 16 },
  { name: "2009 Late Summer Tour", shows: 12 },
  { name: "2010 Fall Tour", shows: 15 },
  { name: "2010 Early Summer Tour", shows: 18 },
  { name: "2010 Late Summer Tour", shows: 11 },
  { name: "2010/2011 NYE Run", shows: 5 },
  { name: "2011 NYE", shows: 4 },
  { name: "2011 Early Summer Tour", shows: 19 },
  { name: "2011 Late Summer Tour", shows: 9 },
  { name: "2012 NYE Run", shows: 4 },
  { name: "2012 Early Summer Tour", shows: 20 },
  { name: "2012 Late Summer Tour", shows: 13 },
  { name: "2013 Fall Tour", shows: 12 },
  { name: "2013 NYE Run", shows: 4 },
  { name: "2013 Summer Tour", shows: 26 },
  { name: "2014 Fall Tour", shows: 12 },
  { name: "2014 Summer", shows: 25 },
  { name: "2014/2015 NYE Run", shows: 4 },
  { name: "2015 Summer", shows: 26 },
  { name: "2015/2016 New Year's Run", shows: 4 },
  { name: "2016 Fall Tour", shows: 13 },
  { name: "2016 Mexico", shows: 3 },
  { name: "2016 NYE Run", shows: 4 },
  { name: "2016 Summer Tour", shows: 25 },
  { name: "2017 Mexico", shows: 3 },
  { name: "2017 NYE Run", shows: 4 },
  { name: "2017 Summer Tour", shows: 21 },
  { name: "2018 Fall Tour", shows: 14 },
  { name: "2018 NYE Run", shows: 4 },
  { name: "2018 Summer Tour", shows: 24 },
  { name: "2019 Fall Tour", shows: 8 },
  { name: "2019 Mexico", shows: 3 },
  { name: "2019 NYE Run", shows: 4 },
  { name: "2019 Summer Tour", shows: 26 },
  { name: "2020 Mexico", shows: 4 },
  { name: "2020 Summer Tour", shows: 27 },
  { name: "2021 Fall Tour", shows: 13 },
  { name: "2021 Summer Tour", shows: 22 },
  { name: "2022 Mexico", shows: 4 },
  { name: "2022 NYE Run", shows: 4 },
  { name: "2022 Spring Tour", shows: 8 },
  { name: "2022 Madison Square Garden Spring Run", shows: 4 },
  { name: "2022 Summer Tour", shows: 26 },
  { name: "2023 Fall Tour", shows: 8 },
  { name: "2023 Mexico", shows: 4 },
  { name: "2023 NYE Run", shows: 4 },
  { name: "2023 Spring Tour", shows: 8 },
  { name: "2023 Summer Tour", shows: 23 },
  { name: "2024 Mexico", shows: 4 },
  { name: "2024 NYE Run", shows: 4 },
  { name: "2024 Sphere", shows: 4 },
  { name: "2024 Summer Tour", shows: 26 },
  { name: "2025 Mexico", shows: 4 },
  { name: "2025 Spring Tour", shows: 8 },
  { name: "2025 Summer Tour", shows: 23 }
];

// Process tour data to generate sample shows
function generateSampleShows() {
  const allShows = [];
  const defaultVenues = {
    'Fall Tour': 'Fall Tour Venue',
    'NYE Run': 'Madison Square Garden',
    'Spring Tour': 'Spring Tour Venue',
    'Summer European Tour': 'European Venue',
    'Summer U.S. Tour': 'Summer Venue',
    'Winter Tour': 'Winter Venue',
    'Winter/Spring Tour': 'Winter/Spring Venue',
    'Summer Tour': 'Summer Tour Venue',
    'Island Tour': 'Nassau Coliseum',
    'Summer Japan Tour': 'Japan Venue',
    'NYC Tour': 'Madison Square Garden',
    'Vegas Run': 'MGM Grand Garden Arena',
    'Hampton Reunion Run': 'Hampton Coliseum',
    'Late Summer Tour': 'Late Summer Venue',
    'Early Summer Tour': 'Early Summer Venue',
    'Mexico': 'Moon Palace Resort',
    'Sphere': 'Sphere Las Vegas',
    'Madison Square Garden Spring Run': 'Madison Square Garden'
  };

  const defaultLocations = {
    'Fall Tour': 'Various Cities, US',
    'NYE Run': 'New York, NY',
    'Spring Tour': 'Various Cities, US',
    'Summer European Tour': 'Various Cities, Europe',
    'Summer U.S. Tour': 'Various Cities, US',
    'Winter Tour': 'Various Cities, US',
    'Winter/Spring Tour': 'Various Cities, US',
    'Summer Tour': 'Various Cities, US',
    'Island Tour': 'Uniondale, NY',
    'Summer Japan Tour': 'Various Cities, Japan',
    'NYC Tour': 'New York, NY',
    'Vegas Run': 'Las Vegas, NV',
    'Hampton Reunion Run': 'Hampton, VA',
    'Late Summer Tour': 'Various Cities, US',
    'Early Summer Tour': 'Various Cities, US',
    'Mexico': 'Cancún, Mexico',
    'Sphere': 'Las Vegas, NV',
    'Madison Square Garden Spring Run': 'New York, NY'
  };

  // Process each tour
  tourData.forEach(tour => {
    const tourName = tour.name;
    const showCount = tour.shows;
    
    // Extract year and tour type
    const yearMatch = tourName.match(/^(\d{4}(?:\/\d{4})?)(?:\s+(.+))?$/);
    if (yearMatch) {
      const year = yearMatch[1];
      const tourType = yearMatch[2] || 'Tour';
      
      // Find default venue and location based on tour type
      let venue = 'Default Venue';
      let location = 'Default Location, US';
      
      for (const [key, value] of Object.entries(defaultVenues)) {
        if (tourType.includes(key)) {
          venue = value;
          location = defaultLocations[key];
          break;
        }
      }
      
      // Generate a sample show for each tour
      allShows.push({
        year: parseInt(year),
        tourName: tourName,
        showCount: showCount,
        date: `January 1, ${year}`,
        venue: venue,
        city_state: location,
        imageUrl: '/images/2024-07-30-chaifetz-arena.jpg',
        net_link: `https://phish.net/tour/${year.toLowerCase()}-${tourType.toLowerCase().replace(/\s+/g, '-')}.html`
      });
    }
  });
  
  return allShows;
}

// Update the tours.json file with the complete tour data
function updateToursData() {
  try {
    const shows = generateSampleShows();
    
    // Create a structured object with tours grouped by year
    const toursByYear = {};
    shows.forEach(show => {
      const year = show.year;
      if (!toursByYear[year]) {
        toursByYear[year] = [];
      }
      
      toursByYear[year].push({
        name: show.tourName,
        shows: show.showCount,
        sample_url: show.net_link
      });
    });
    
    // Format as a flat array for consistency with existing data
    const formattedTours = [];
    Object.keys(toursByYear).sort((a, b) => parseInt(a) - parseInt(b)).forEach(year => {
      toursByYear[year].forEach(tour => {
        formattedTours.push({
          year: parseInt(year),
          name: tour.name,
          show_count: tour.shows,
          sample_url: tour.sample_url
        });
      });
    });
    
    // Prepare JSON data
    const jsonData = JSON.stringify({
      tours: formattedTours
    }, null, 2);
    
    // Save to src/data directory
    const srcFilePath = path.join(process.cwd(), 'src/data/tours.json');
    fs.mkdirSync(path.dirname(srcFilePath), { recursive: true });
    fs.writeFileSync(srcFilePath, jsonData);
    console.log(`Updated tours.json in src/data with ${formattedTours.length} tours`);
    
    // Save to public/data directory for frontend access
    const publicFilePath = path.join(process.cwd(), 'public/data/tours.json');
    fs.mkdirSync(path.dirname(publicFilePath), { recursive: true });
    fs.writeFileSync(publicFilePath, jsonData);
    console.log(`Updated tours.json in public/data with ${formattedTours.length} tours`);
    
    return { srcFilePath, publicFilePath };
  } catch (error) {
    console.error('Error updating tours data:', error);
    throw error;
  }
}

// Run the update
try {
  const filePath = updateToursData();
  console.log(`Tour data update completed. Data saved to ${filePath.srcFilePath} and ${filePath.publicFilePath}`);
} catch (error) {
  console.error('Failed to update tour data:', error);
  process.exit(1);
} 