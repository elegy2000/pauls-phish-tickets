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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Run the multer middleware
    await runMiddleware(req, res, upload.single('csvFile'));
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('Received file:', req.file.originalname);
    const csvData = req.file.buffer.toString();
    console.log('CSV Data preview:', csvData.substring(0, 200)); // Log first 200 chars
    
    const result = await handleCsvUpload(csvData);
    console.log('Upload result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
} 