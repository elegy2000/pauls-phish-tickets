const fs = require('fs');
const path = require('path');

// We'll start with 2013 Summer Tour as an example of more detailed data
const detailedTourData = {
  '2013 Summer Tour': [
    {
      date: 'July 3, 2013',
      venue: "Darling's Waterfront Pavilion",
      location: "Bangor, ME"
    },
    {
      date: 'July 5, 2013',
      venue: "Saratoga Performing Arts Center",
      location: "Saratoga Springs, NY"
    },
    {
      date: 'July 6, 2013',
      venue: "Saratoga Performing Arts Center",
      location: "Saratoga Springs, NY"
    },
    {
      date: 'July 7, 2013',
      venue: "Saratoga Performing Arts Center",
      location: "Saratoga Springs, NY"
    },
    {
      date: 'July 9, 2013',
      venue: "Molson Canadian Amphitheatre",
      location: "Toronto, Ontario, Canada"
    },
    {
      date: 'July 10, 2013',
      venue: "PNC Bank Arts Center",
      location: "Holmdel, NJ"
    },
    {
      date: 'July 12, 2013',
      venue: "Nikon at Jones Beach Theater",
      location: "Wantagh, NY"
    },
    {
      date: 'July 13, 2013',
      venue: "Merriweather Post Pavilion",
      location: "Columbia, MD"
    },
    {
      date: 'July 14, 2013',
      venue: "Merriweather Post Pavilion",
      location: "Columbia, MD"
    },
    {
      date: 'July 16, 2013',
      venue: "Verizon Wireless Amphitheatre at Encore Park",
      location: "Alpharetta, GA"
    },
    {
      date: 'July 17, 2013',
      venue: "Verizon Wireless Amphitheatre at Encore Park",
      location: "Alpharetta, GA"
    },
    {
      date: 'July 19, 2013',
      venue: "FirstMerit Bank Pavilion at Northerly Island",
      location: "Chicago, IL"
    },
    {
      date: 'July 20, 2013',
      venue: "FirstMerit Bank Pavilion at Northerly Island",
      location: "Chicago, IL"
    },
    {
      date: 'July 21, 2013',
      venue: "FirstMerit Bank Pavilion at Northerly Island",
      location: "Chicago, IL"
    },
    {
      date: 'July 22, 2013',
      venue: "Molson Canadian Amphitheatre",
      location: "Toronto, Ontario, Canada"
    },
    {
      date: 'July 26, 2013',
      venue: "Gorge Amphitheatre",
      location: "George, WA"
    },
    {
      date: 'July 27, 2013',
      venue: "Gorge Amphitheatre",
      location: "George, WA"
    },
    {
      date: 'July 30, 2013',
      venue: "Lake Tahoe Outdoor Arena at Harveys",
      location: "Stateline, NV"
    },
    {
      date: 'July 31, 2013',
      venue: "Lake Tahoe Outdoor Arena at Harveys",
      location: "Stateline, NV"
    },
    {
      date: 'August 2, 2013',
      venue: "Bill Graham Civic Auditorium",
      location: "San Francisco, CA"
    },
    {
      date: 'August 3, 2013',
      venue: "Bill Graham Civic Auditorium",
      location: "San Francisco, CA"
    },
    {
      date: 'August 4, 2013',
      venue: "Bill Graham Civic Auditorium",
      location: "San Francisco, CA"
    },
    {
      date: 'August 5, 2013',
      venue: "Hollywood Bowl",
      location: "Hollywood, CA"
    },
    {
      date: 'August 30, 2013',
      venue: "Dick's Sporting Goods Park",
      location: "Commerce City, CO"
    },
    {
      date: 'August 31, 2013',
      venue: "Dick's Sporting Goods Park",
      location: "Commerce City, CO"
    },
    {
      date: 'September 1, 2013',
      venue: "Dick's Sporting Goods Park",
      location: "Commerce City, CO"
    }
  ]
};

// Read the existing all_shows.json file
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

// Read the tour data to get the sample_url for each tour
const tourData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/tours.json'), 'utf8')).tours;

// Find the 2013 Summer Tour in tourData
const summerTour2013 = tourData.find(tour => tour.name === '2013 Summer Tour');
const tourUrl = summerTour2013 ? summerTour2013.sample_url : '';

// Filter out existing 2013 Summer Tour shows
const filtered2013Shows = existingShows.filter(show => {
  return !(show.year === '2013 Summer' || (show.year === '2013' && show.date.includes('July') || show.date.includes('August')));
});

// Add the new, detailed 2013 Summer Tour shows
const newShows = detailedTourData['2013 Summer Tour'].map(show => {
  return {
    year: '2013 Summer',
    date: show.date,
    venue: show.venue,
    location: show.location,
    imageUrl: '/images/2024-07-30-chaifetz-arena.jpg', // Default image
    netLink: tourUrl
  };
});

// Combine filtered existing shows with new 2013 Summer Tour shows
const combinedShows = [...filtered2013Shows, ...newShows];

// Write the combined shows to the all_shows.json file
const showsFilePath = path.join(process.cwd(), 'public/data/all_shows.json');
fs.writeFileSync(showsFilePath, JSON.stringify(combinedShows, null, 2));
console.log(`Updated 2013 Summer Tour with ${newShows.length} shows (total: ${combinedShows.length})`);

console.log('Show data update completed. Data saved to public/data/all_shows.json'); 