const fs = require('fs');
const path = require('path');

// Function to read a JSON file
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

// Function to clean a string for use in URLs
function cleanString(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Function to fix city and state
function fixLocation(location) {
    // Common fixes for city/state combinations
    const fixes = {
        'York, NY': 'New York, NY',
        'Alto, PA': 'Mont Alto, PA',
        'Lake, NH': 'Squam Lake, NH',
        'Hope, PA': 'New Hope, PA'
    };
    
    // First check if it's a known fix
    if (fixes[location]) {
        return fixes[location].split(',').map(s => s.trim());
    }
    
    // Otherwise split and clean
    const [city, state] = location.split(',').map(s => s.trim());
    return [city, state || ''];
}

// Function to determine correct tour name
function getTourName(show) {
    const date = new Date(show.date);
    const year = date.getFullYear();
    
    // Extract month for seasonal tours
    const month = date.getMonth() + 1; // 0-based to 1-based
    
    let season = '';
    if (month >= 12 || month <= 2) {
        season = 'Winter';
    } else if (month >= 3 && month <= 5) {
        season = 'Spring';
    } else if (month >= 6 && month <= 8) {
        season = 'Summer';
    } else if (month >= 9 && month <= 11) {
        season = 'Fall';
    }
    
    // Special case for NYE shows
    if (month === 12 && date.getDate() >= 28) {
        return `${year} NYE Run`;
    }
    
    // For early years (1983-1989), just use the year
    if (year <= 1989) {
        return `${year} Tour`;
    }
    
    // For later years, include the season
    return `${year} ${season} Tour`;
}

// Function to clean and format tour data
function cleanTourData(tourData) {
    return tourData.map(show => {
        const [city, state] = fixLocation(show.location);
        const date = new Date(show.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return {
            tour_name: getTourName(show),
            date: formattedDate,
            venue: show.venue,
            city: city,
            state: state,
            image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-images/${cleanString(show.date)}-${cleanString(show.venue)}.jpg`,
            setlist_link: show.netLink
        };
    });
}

// Main function to combine all tours
function combineTours() {
    const dataDir = path.join(__dirname, '../data');
    const files = fs.readdirSync(dataDir);
    const tourFiles = files.filter(file => file.endsWith('_tour.json'));
    
    let allShows = [];
    
    for (const file of tourFiles) {
        const filePath = path.join(dataDir, file);
        const tourData = readJsonFile(filePath);
        const cleanedData = cleanTourData(tourData);
        allShows = allShows.concat(cleanedData);
    }
    
    // Remove duplicates based on date and venue
    const uniqueShows = allShows.filter((show, index, self) =>
        index === self.findIndex(s => 
            s.date === show.date && 
            s.venue === show.venue
        )
    );
    
    // Sort shows by date
    uniqueShows.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Convert to CSV
    const headers = ['tour_name', 'date', 'venue', 'city', 'state', 'image_url', 'setlist_link'];
    const csvRows = [
        headers.join(','),
        ...uniqueShows.map(show => headers.map(header => `"${show[header]}"`).join(','))
    ];
    
    // Write to file
    fs.writeFileSync(
        path.join(dataDir, 'phish_tours_clean.csv'),
        csvRows.join('\n'),
        'utf8'
    );
    
    console.log(`Successfully wrote ${uniqueShows.length} unique shows to CSV`);
}

combineTours(); 