const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs');

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '4.5mb', // Vercel's limit
    externalResolver: true,
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'ticket-images';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey 
  });
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ 
      multiples: true,
      maxFileSize: 4 * 1024 * 1024,       // 4MB per file (Vercel limit)
      maxTotalFileSize: 4 * 1024 * 1024,  // 4MB total per request
      keepExtensions: true,
      // Add timeout to prevent hanging
      uploadTimeout: 30000, // 30 seconds
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Formidable parsing error:', err);
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    console.log('Upload request received');
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error - missing Supabase credentials'
      });
    }
    
    // Validate key format
    if (supabaseKey.length < 100) {
      console.error('Service role key appears to be truncated');
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid service role key configuration',
        debug: { keyLength: supabaseKey.length }
      });
    }
    
    const { files } = await parseForm(req);
    console.log('Parsed files:', Object.keys(files));
    
    let images = files.images;
    if (!images) {
      console.log('No images field found, available fields:', Object.keys(files));
      return res.status(400).json({ 
        success: false, 
        message: 'No images uploaded',
        debug: { availableFields: Object.keys(files) }
      });
    }
    
    if (!Array.isArray(images)) images = [images];
    console.log(`Processing ${images.length} images`);

    const uploaded = [];
    const errors = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      console.log(`Processing file ${i + 1}/${images.length}: ${file.originalFilename || file.name}`);
      
      try {
        // Support both 'filepath' (v2+) and 'path' (v1.x)
        const filePath = file.filepath || file.path;
        if (!filePath) {
          throw new Error('File path missing in upload');
        }
        
        // Check file size
        const stats = await fs.promises.stat(filePath);
        if (stats.size > 4 * 1024 * 1024) { // 4MB limit
          throw new Error(`File too large: ${Math.round(stats.size / 1024 / 1024 * 10) / 10}MB (max 4MB)`);
        }
        
        const buffer = await fs.promises.readFile(filePath);
        const fileName = file.originalFilename || file.name;
        
        console.log(`Uploading ${fileName} (${Math.round(buffer.length / 1024)}KB) to Supabase`);
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, {
            upsert: true,
            contentType: file.mimetype || file.type || 'image/jpeg',
          });
          
        if (uploadError) {
          console.error(`Supabase upload error for ${fileName}:`, uploadError);
          errors.push(`${fileName}: ${uploadError.message}`);
          continue;
        }
        
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        uploaded.push({ fileName, url: data.publicUrl });
        console.log(`Successfully uploaded ${fileName}`);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.originalFilename || file.name}:`, fileError);
        errors.push(`${file.originalFilename || file.name}: ${fileError.message}`);
      }
    }
    
    // Return results with both successes and failures
    const response = {
      success: uploaded.length > 0,
      message: uploaded.length > 0 
        ? `Successfully uploaded ${uploaded.length} of ${images.length} images`
        : 'All uploads failed',
      files: uploaded,
      uploadedCount: uploaded.length,
      totalCount: images.length
    };
    
    if (errors.length > 0) {
      response.errors = errors;
      response.message += `. ${errors.length} files failed.`;
    }
    
    console.log(`Upload complete: ${uploaded.length}/${images.length} successful`);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error in upload handler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during upload', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 