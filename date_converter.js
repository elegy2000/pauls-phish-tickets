const fs = require('fs');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Function to convert date from "Month DD, YYYY" to "YYYY-MM-DD"
function convertDate(dateStr) {
    const months = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    try {
        const match = dateStr.match(/(\w+)\s+(\d+),\s+(\d{4})/);
        if (!match) return dateStr; // Return original if no match

        const [_, month, day, year] = match;
        const monthNum = months[month];
        const dayPadded = day.padStart(2, '0');

        return `${year}-${monthNum}-${dayPadded}`;
    } catch (error) {
        console.error(`Error converting date ${dateStr}:`, error);
        return dateStr;
    }
}

// Read the input CSV file
const inputFile = 'Various documents/phish_tours_links_off_lowercase.csv';
const outputFile = 'Various documents/phish_tours_links_off_formatted.csv';

try {
    // Read and parse the CSV file
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    const records = csv.parse(csvContent, {
        columns: true,
        skip_empty_lines: true
    });

    // Convert dates in each record
    const convertedRecords = records.map(record => ({
        ...record,
        date: convertDate(record.date)
    }));

    // Convert back to CSV
    const output = stringify(convertedRecords, {
        header: true,
        columns: Object.keys(records[0])
    });

    // Write to new file
    fs.writeFileSync(outputFile, output);
    console.log(`Converted CSV file saved to ${outputFile}`);

} catch (error) {
    console.error('Error processing CSV file:', error);
} 