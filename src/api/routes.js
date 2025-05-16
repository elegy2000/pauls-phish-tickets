const express = require('express');
const multer = require('multer');
const { handleCsvUpload, handleCsvDownload } = require('./csvHandler');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Test the upload endpoint with:
// curl -F "csvFile=@/path/to/your/file.csv" http://localhost:3000/api/upload
// Make sure the field name is csvFile

// Upload CSV endpoint
router.post('/upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file uploaded or wrong field name. Expected field: csvFile');
      return res.status(400).json({ success: false, message: 'No file uploaded or wrong field name. Expected field: csvFile' });
    }

    console.log('File received:', req.file.originalname, 'size:', req.file.size);
    const csvData = req.file.buffer.toString();
    // Overwrite the main CSV file with the uploaded content
    const csvFilePath = path.join(process.cwd(), 'data/phish_tours.csv');
    fs.writeFileSync(csvFilePath, csvData);
    console.log('CSV file written to:', csvFilePath);
    // Verify CSV exists and is not empty
    try {
      const stats = fs.statSync(csvFilePath);
      if (stats.size === 0) {
        console.error('CSV file is empty after upload!');
        return res.status(500).json({ success: false, message: 'CSV file is empty after upload!' });
      }
    } catch (err) {
      console.error('CSV file missing after upload!', err);
      return res.status(500).json({ success: false, message: 'CSV file missing after upload!' });
    }
    const result = await handleCsvUpload(csvData);
    // Clear require cache for tickets.json if it exists
    const ticketsJsonPath = path.join(process.cwd(), 'public/data/tickets.json');
    if (require.cache[ticketsJsonPath]) {
      delete require.cache[ticketsJsonPath];
    }
    console.log('tickets.json written to:', ticketsJsonPath);
    // Verify tickets.json exists and is not empty
    try {
      const stats = fs.statSync(ticketsJsonPath);
      if (stats.size === 0) {
        console.error('tickets.json is empty after upload!');
        return res.status(500).json({ success: false, message: 'tickets.json is empty after upload!' });
      }
    } catch (err) {
      console.error('tickets.json missing after upload!', err);
      return res.status(500).json({ success: false, message: 'tickets.json missing after upload!' });
    }
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Download CSV endpoint
router.get('/download', async (req, res) => {
  try {
    const result = await handleCsvDownload();
    
    if (result.success) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=phish_tours.csv');
      res.send(result.data);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in download endpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 