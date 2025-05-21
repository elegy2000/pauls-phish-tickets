const fs = require('fs');
const path = require('path');

// List of shows that have ticket stub images
const showsWithImages = [
    // Add shows with images here
];

// Function to convert date string to image filename format
function dateToImageFormat(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Function to check if a show has an image
function hasImage(show) {
    const imageDate = dateToImageFormat(show.date);
    return showsWithImages.includes(imageDate);
}

// Function to get image path for a show
function getImagePath(show) {
    if (hasImage(show)) {
        const imageDate = dateToImageFormat(show.date);
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-images/${imageDate}-${show.venue.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    }
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ticket-images/default-ticket.jpg`;
}

// Read all tour JSON files
const dataDir = path.join(__dirname, '../data');
const tourFiles = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('_tour.json') && !file.includes('future'))
    .map(file => path.join(dataDir, file));

// Process each tour file and combine shows
let allShows = [];
tourFiles.forEach(file => {
    try {
        const tourData = JSON.parse(fs.readFileSync(file, 'utf8'));
        // Validate and clean the data
        const validShows = tourData.filter(show => {
            // Basic validation
            if (!show.date || !show.venue || !show.location) return false;
            
            // Check if date is valid
            const date = new Date(show.date);
            if (isNaN(date.getTime())) return false;
            
            return true;
        });
        
        allShows = allShows.concat(validShows);
    } catch (error) {
        console.error(`Error processing file ${file}:`, error);
    }
});

// Sort shows by date
allShows.sort((a, b) => new Date(a.date) - new Date(b.date));

// Create CSV content
let csvContent = 'YEAR,DATE,VENUE,CITY/STATE,imageUrl,NET LINK\n';
allShows.forEach(show => {
    const year = new Date(show.date).getFullYear();
    const imagePath = getImagePath(show);
    csvContent += `${year},${show.date},${show.venue},${show.location},${imagePath},${show.netLink}\n`;
});

// Write to CSV file
const outputPath = path.join(__dirname, '../pauls-ticket-site/public/data/phish_tours.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`CSV updated with ${allShows.length} shows`);
console.log(`Shows with ticket stub images: ${showsWithImages.length}`); 