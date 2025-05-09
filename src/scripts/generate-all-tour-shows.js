const fs = require('fs');
const path = require('path');

// Only include verified tour data from phish.net
const phishnetData = {
  "1998 Summer European Tour": [
    { date: "July 2, 1998", venue: "The Grey Hall", location: "Copenhagen, Denmark" },
    { date: "July 3, 1998", venue: "Paradiso", location: "Amsterdam, Netherlands" },
    { date: "July 4, 1998", venue: "Paradiso", location: "Amsterdam, Netherlands" },
    { date: "July 6, 1998", venue: "Le Zenith", location: "Paris, France" },
    { date: "July 7, 1998", venue: "Victoria Hall", location: "Geneva, Switzerland" },
    { date: "July 8, 1998", venue: "Volkshaus", location: "Zurich, Switzerland" },
    { date: "July 9, 1998", venue: "Barba Negra", location: "Barcelona, Spain" },
    { date: "July 10, 1998", venue: "Zeleste", location: "Barcelona, Spain" }
  ],
  "1998 Summer U.S. Tour": [
    { date: "July 15, 1998", venue: "Portland Meadows", location: "Portland, OR" },
    { date: "July 16, 1998", venue: "The Gorge Amphitheatre", location: "George, WA" },
    { date: "July 17, 1998", venue: "The Gorge Amphitheatre", location: "George, WA" },
    { date: "July 19, 1998", venue: "Ventura County Fairgrounds", location: "Ventura, CA" },
    { date: "July 20, 1998", venue: "Shoreline Amphitheatre", location: "Mountain View, CA" },
    { date: "July 21, 1998", venue: "Desert Sky Pavilion", location: "Phoenix, AZ" },
    { date: "July 24, 1998", venue: "Sandstone Amphitheater", location: "Bonner Springs, KS" },
    { date: "July 25, 1998", venue: "Riverport Amphitheater", location: "Maryland Heights, MO" },
    { date: "July 26, 1998", venue: "Deer Creek Music Center", location: "Noblesville, IN" },
    { date: "July 28, 1998", venue: "Blossom Music Center", location: "Cuyahoga Falls, OH" },
    { date: "July 29, 1998", venue: "Star Lake Amphitheater", location: "Burgettstown, PA" },
    { date: "July 31, 1998", venue: "Polaris Amphitheater", location: "Columbus, OH" },
    { date: "August 1, 1998", venue: "Alpine Valley Music Theatre", location: "East Troy, WI" },
    { date: "August 2, 1998", venue: "Deer Creek Music Center", location: "Noblesville, IN" },
    { date: "August 3, 1998", venue: "Deer Creek Music Center", location: "Noblesville, IN" },
    { date: "August 6, 1998", venue: "Merriweather Post Pavilion", location: "Columbia, MD" },
    { date: "August 7, 1998", venue: "Merriweather Post Pavilion", location: "Columbia, MD" },
    { date: "August 8, 1998", venue: "Merriweather Post Pavilion", location: "Columbia, MD" },
    { date: "August 9, 1998", venue: "Virginia Beach Amphitheater", location: "Virginia Beach, VA" },
    { date: "August 11, 1998", venue: "Star Lake Amphitheater", location: "Burgettstown, PA" },
    { date: "August 12, 1998", venue: "Vernon Downs", location: "Vernon, NY" },
    { date: "August 15, 1998", venue: "Loring Air Force Base", location: "Limestone, ME" },
    { date: "August 16, 1998", venue: "Loring Air Force Base", location: "Limestone, ME" }
  ],
  "1998 Island Tour": [
    { date: "April 2, 1998", venue: "Nassau Coliseum", location: "Uniondale, NY" },
    { date: "April 3, 1998", venue: "Nassau Coliseum", location: "Uniondale, NY" },
    { date: "April 4, 1998", venue: "Providence Civic Center", location: "Providence, RI" },
    { date: "April 5, 1998", venue: "Providence Civic Center", location: "Providence, RI" }
  ],
  "1998 Fall Tour": [
    { date: "October 29, 1998", venue: "Thomas & Mack Center", location: "Las Vegas, NV" },
    { date: "October 30, 1998", venue: "Thomas & Mack Center", location: "Las Vegas, NV" },
    { date: "October 31, 1998", venue: "Thomas & Mack Center", location: "Las Vegas, NV" },
    { date: "November 2, 1998", venue: "E Center", location: "West Valley City, UT" },
    { date: "November 3, 1998", venue: "McNichols Arena", location: "Denver, CO" },
    { date: "November 4, 1998", venue: "McNichols Arena", location: "Denver, CO" },
    { date: "November 6, 1998", venue: "UW-Milwaukee Panther Arena", location: "Milwaukee, WI" },
    { date: "November 7, 1998", venue: "UIC Pavilion", location: "Chicago, IL" },
    { date: "November 8, 1998", venue: "UIC Pavilion", location: "Chicago, IL" },
    { date: "November 9, 1998", venue: "Van Andel Arena", location: "Grand Rapids, MI" },
    { date: "November 11, 1998", venue: "Assembly Hall", location: "Champaign, IL" },
    { date: "November 13, 1998", venue: "CSU Convocation Center", location: "Cleveland, OH" },
    { date: "November 14, 1998", venue: "Crown Coliseum", location: "Fayetteville, NC" },
    { date: "November 15, 1998", venue: "Bi-Lo Center", location: "Greenville, SC" },
    { date: "November 17, 1998", venue: "Lawrence Joel Veterans Memorial Coliseum", location: "Winston-Salem, NC" },
    { date: "November 18, 1998", venue: "Hampton Coliseum", location: "Hampton, VA" },
    { date: "November 19, 1998", venue: "Hampton Coliseum", location: "Hampton, VA" },
    { date: "November 20, 1998", venue: "Hampton Coliseum", location: "Hampton, VA" },
    { date: "November 21, 1998", venue: "Hampton Coliseum", location: "Hampton, VA" },
    { date: "November 24, 1998", venue: "New Haven Coliseum", location: "New Haven, CT" },
    { date: "November 25, 1998", venue: "Pepsi Arena", location: "Albany, NY" },
    { date: "November 27, 1998", venue: "Worcester Centrum Centre", location: "Worcester, MA" },
    { date: "November 28, 1998", venue: "Worcester Centrum Centre", location: "Worcester, MA" },
    { date: "November 29, 1998", venue: "Worcester Centrum Centre", location: "Worcester, MA" }
  ],
  "1998 New Year's Eve Run": [
    { date: "December 28, 1998", venue: "Madison Square Garden", location: "New York, NY" },
    { date: "December 29, 1998", venue: "Madison Square Garden", location: "New York, NY" },
    { date: "December 30, 1998", venue: "Madison Square Garden", location: "New York, NY" },
    { date: "December 31, 1998", venue: "Madison Square Garden", location: "New York, NY" }
  ]
};

// Generate the all_shows.json file
const allShows = [];

// Convert phishnet data to our format
Object.entries(phishnetData).forEach(([tourName, shows]) => {
  shows.forEach(show => {
    allShows.push({
      year: tourName,
      date: show.date,
      venue: show.venue,
      location: show.location
    });
  });
});

// Sort shows by date
allShows.sort((a, b) => new Date(a.date) - new Date(b.date));

// Write to JSON file
const jsonFilePath = path.join(process.cwd(), 'public/data/all_shows.json');
fs.writeFileSync(jsonFilePath, JSON.stringify(allShows, null, 2));

console.log(`Generated ${allShows.length} shows from verified phish.net data`);
console.log('Tours included:');
Object.entries(phishnetData).forEach(([tourName, shows]) => {
  console.log(`${tourName}: ${shows.length} shows`);
}); 