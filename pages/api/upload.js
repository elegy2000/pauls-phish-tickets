import multer from 'multer';
import { handleCsvUpload } from '../../src/api/csvHandler';
import nextConnect from 'next-connect';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const apiRoute = nextConnect({
  onError(error, req, res) {
    console.error('API Route Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  },
  onNoMatch(req, res) {
    res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} Not Allowed` 
    });
  },
});

// Add CORS headers
apiRoute.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Handle file upload
apiRoute.post(upload.single('csvFile'), async (req, res) => {
  try {
    console.log('Request received:', {
      method: req.method,
      headers: req.headers,
      file: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        size: req.file.size,
      } : 'No file'
    });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('Received file:', req.file.originalname);
    const csvData = req.file.buffer.toString();
    console.log('CSV Data preview:', csvData.substring(0, 200));
    
    const result = await handleCsvUpload(csvData);
    console.log('Upload result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default apiRoute; 