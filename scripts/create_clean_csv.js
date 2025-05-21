const fs = require('fs');
const path = require('path');

// Function to clean venue name
function cleanVenueName(venue) {
    // Remove "Phish" prefix and date if present
    let cleaned = venue.replace(/^Phish\s+\w+\s+\d{1,2}\s+\d{4}\s+/, '');
    
    // Standardize common venue name variations
    const replacements = {
        'Harris Millis Cafeteria University Of Vermont Burlington': 'Harris-Millis Cafeteria - University Of Vermont',
        'Harris Millis Cafeteria': 'Harris-Millis Cafeteria',
        'Hunt\'s': 'Hunts',
        'Nectar\'S': 'Nectars',
        'Nectars Burlington': 'Nectars',
        'Hunts Burlington': 'Hunts',
        'The Front Burlington': 'The Front',
        'Slade Hall, University Of Vermont': 'Slade Hall University Of Vermont',
        'Ira Allen Chapel, University Of Vermont': 'Ira Allen Chapel University Of Vermont',
        'WRUV Radio': 'WRUV Radio Burlington',
        'Goddard College Plainfield': 'Goddard College',
        'Unknown Venue Enosburg': 'Unknown Venue',
        'Memorial Auditorium Burlington': 'Memorial Auditorium',
        'University Of Vermont Burlington': 'University Of Vermont'
    };
    
    for (const [original, replacement] of Object.entries(replacements)) {
        cleaned = cleaned.replace(new RegExp(original, 'i'), replacement);
    }
    
    return cleaned.trim();
}

// Function to clean location
function cleanLocation(location) {
    // Standardize state abbreviations and formats
    let cleaned = location.replace(/, USA$/, '').trim();
    
    // Fix common location issues
    const replacements = {
        'York, NY': 'New York, NY',
        'Lake, NH': 'Squam Lake, NH',
        'Hope, PA': 'New Hope, PA',
        'Alto, PA': 'Mont Alto, PA',
        'Vt': 'Burlington, VT'
    };
    
    for (const [original, replacement] of Object.entries(replacements)) {
        cleaned = cleaned.replace(new RegExp(`^${original}$`, 'i'), replacement);
    }
    
    return cleaned;
}

// Function to format date consistently
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Function to create a unique key for a show
function createShowKey(show) {
    const date = new Date(show.date);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const venue = cleanVenueName(show.venue).toLowerCase();
    const location = cleanLocation(show.location).toLowerCase();
    return `${dateStr}-${venue}-${location}`;
}

// Function to validate show data
function isValidShow(show) {
    if (!show.date || !show.venue || !show.location) return false;
    
    // Check if date is valid
    const date = new Date(show.date);
    if (isNaN(date.getTime())) return false;
    
    // Check if it's a future show (beyond 2025)
    if (date.getFullYear() > 2025) return false;
    
    return true;
}

// Function to get image path
function getImagePath(show) {
    // For now, use default image
    // TODO: Add logic to check for actual ticket stub images
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-images/default-ticket.jpg`;
}

// Read all tour JSON files
const dataDir = path.join(__dirname, '../data');
const tourFiles = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('_tour.json') && !file.includes('future'))
    .map(file => path.join(dataDir, file));

// Process each tour file and combine shows
let allShows = new Map(); // Use Map to prevent duplicates

tourFiles.forEach(file => {
    try {
        const tourData = JSON.parse(fs.readFileSync(file, 'utf8'));
        tourData.forEach(show => {
            if (isValidShow(show)) {
                const key = createShowKey(show);
                if (!allShows.has(key)) {
                    allShows.set(key, {
                        year: new Date(show.date).getFullYear(),
                        date: formatDate(show.date),
                        venue: cleanVenueName(show.venue),
                        location: cleanLocation(show.location),
                        imageurl: getImagePath(show),
                        netLink: show.netLink
                    });
                }
            }
        });
    } catch (error) {
        console.error(`Error processing file ${file}:`, error);
    }
});

// Convert Map to array and sort by date
const sortedShows = Array.from(allShows.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

// Create CSV content
let csvContent = 'YEAR,DATE,VENUE,CITY/STATE,imageurl,NET LINK\n';
sortedShows.forEach(show => {
    // Escape fields that might contain commas
    const venue = show.venue.includes(',') ? `"${show.venue}"` : show.venue;
    const location = show.location.includes(',') ? `"${show.location}"` : show.location;
    
    csvContent += `${show.year},${show.date},${venue},${location},${show.imageurl},${show.netLink}\n`;
});

// Write to CSV file
const outputPath = path.join(__dirname, '../pauls-ticket-site/public/data/phish_tours.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`CSV created with ${sortedShows.length} unique shows`); 