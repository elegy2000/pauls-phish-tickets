import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Configure multer for memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// Function to upload image to GitHub
async function uploadImageToGitHub(imageBuffer, filename) {
  const REPO_OWNER = process.env.GITHUB_OWNER || 'YOUR_GITHUB_USERNAME';
  const REPO_NAME = process.env.GITHUB_REPO || 'Paul-Phish-Tickets';
  const BRANCH = process.env.GITHUB_BRANCH || 'main';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token is not configured');
  }

  try {
    // Path in the GitHub repo for the image
    const filePath = `public/images/${filename}`;
    
    // Get existing file (if it exists)
    let sha = null;
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      sha = response.data.sha;
    } catch (error) {
      // File doesn't exist yet, which is fine
    }

    // Upload to GitHub
    const payload = {
      message: `Upload image: ${filename}`,
      content: imageBuffer.toString('base64'),
      branch: BRANCH,
    };

    if (sha) {
      payload.sha = sha;
    }

    const uploadResponse = await axios.put(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      payload,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // Return the raw URL to the image
    const imageUrl = `/images/${filename}`;
    return imageUrl;
  } catch (error) {
    console.error('GitHub API error:', error.response?.data || error.message);
    throw new Error(`Failed to upload image to GitHub: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check if GitHub environment variables are set
    if (!process.env.GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN is not set');
      return res.status(500).json({ 
        success: false, 
        message: 'GitHub token is not configured. Please check server configuration.',
        debug: 'GITHUB_TOKEN missing'
      });
    }

    if (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      console.error('GITHUB_OWNER or GITHUB_REPO is not set');
      return res.status(500).json({ 
        success: false, 
        message: 'GitHub repository information is not properly configured.',
        debug: `Owner: ${process.env.GITHUB_OWNER || 'missing'}, Repo: ${process.env.GITHUB_REPO || 'missing'}`
      });
    }

    // Run the multer middleware
    await runMiddleware(req, res, upload.single('image'));
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Create a filename based on the original name, but sanitized
    const ext = path.extname(req.file.originalname);
    const sanitizedName = req.file.originalname
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now();
    const filename = `${sanitizedName}-${timestamp}${ext}`;

    // Upload to GitHub
    const imagePath = await uploadImageToGitHub(req.file.buffer, filename);

    // Return the filename and path
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: filename,
        path: imagePath
      }
    });
  } catch (error) {
    console.error('Error in image upload endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
} 