import multer from 'multer';
import { handleCsvUpload } from '../../src/api/csvHandler';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Set up middleware handler for multer
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

// Disable the built-in bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const csvData = req.file.buffer.toString();
    const result = await handleCsvUpload(csvData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 