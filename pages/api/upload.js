import multer from 'multer';
import { handleCsvUpload } from '../../src/api/csvHandler';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create middleware handler for multer
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Add CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} Not Allowed` 
    });
  }

  try {
    console.log('Request received:', {
      method: req.method,
      headers: req.headers
    });

    // Run the multer middleware
    await runMiddleware(req, res, upload.single('csvFile'));

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded',
        error: 'Please select a CSV file to upload'
      });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type',
        error: 'Please upload a CSV file'
      });
    }

    console.log('Received file:', req.file.originalname);
    const csvData = req.file.buffer.toString();
    
    // Check if the CSV is empty
    if (!csvData.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Empty CSV file',
        error: 'The uploaded CSV file is empty'
      });
    }
    
    console.log('CSV Data preview:', csvData.substring(0, 200));
    
    const result = await handleCsvUpload(csvData);
    console.log('Upload result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        ...result,
        error: result.error || 'Failed to process CSV file',
        details: result.details || undefined
      });
    }
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        type: error.name
      } : undefined
    });
  }
} 