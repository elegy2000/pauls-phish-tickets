import multer from 'multer';
import { handleCsvUpload } from '../../src/api/csvHandler';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// Validate environment variables
function validateEnvironment() {
  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };

  console.log('Environment check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([name]) => name);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
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
    // Validate environment before proceeding
    validateEnvironment();

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
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: 'Maximum file size is 5MB'
      });
    }

    // Handle environment validation errors
    if (error.message.includes('Missing required environment variables')) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: error.message
      });
    }

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