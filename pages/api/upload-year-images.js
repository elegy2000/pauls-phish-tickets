import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Add debugging for environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseServiceKey 
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables early
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
      error: 'Missing Supabase credentials'
    });
  }

  try {
    const form = formidable({
      maxFileSize: 4 * 1024 * 1024, // 4MB limit
      keepExtensions: true,
      multiples: true,
    });

    // Use formidable v1.x callback API
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });
    
    console.log('Files object:', Object.keys(files));
    
    // Handle both single file and multiple files from formidable
    let yearImages = files.yearImages || [];
    if (!Array.isArray(yearImages)) {
      yearImages = [yearImages]; // Convert single file to array
    }
    
    console.log('Received year images for upload:', yearImages.length);

    if (!yearImages || yearImages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No year images provided' 
      });
    }

    // Get list of existing year images to validate against
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('year-images')
      .list('', { limit: 100 });

    if (listError) {
      console.error('Error listing existing year images:', listError);
      
      // If bucket doesn't exist, create it and provide a helpful error message
      if (listError.message?.includes('Bucket not found')) {
        console.log('year-images bucket not found, attempting to create it...');
        
        // Try to create the bucket
        const { data: bucketData, error: bucketError } = await supabase.storage
          .createBucket('year-images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            fileSizeLimit: 4194304 // 4MB
          });

        if (bucketError) {
          console.error('Failed to create year-images bucket:', bucketError);
          return res.status(500).json({
            success: false,
            message: 'year-images bucket does not exist and could not be created',
            error: bucketError.message,
            suggestion: 'Please create the year-images bucket in Supabase Storage manually'
          });
        }

        console.log('✅ Created year-images bucket successfully');
        
        // Return early with instructions since there are no existing files yet
        return res.status(400).json({
          success: false,
          message: 'year-images bucket was just created but is empty',
          replacedCount: 0,
          suggestion: 'Please upload some year images first using the script or manually to establish the expected filenames'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to validate against existing images',
        error: listError.message
      });
    }

    const existingFilenames = existingFiles ? existingFiles.map(f => f.name) : [];
    console.log('Existing year images in storage:', existingFilenames);
    
    // If no existing files, provide helpful message
    if (existingFilenames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No existing year images found in storage',
        replacedCount: 0,
        suggestion: 'Please upload some year images first to establish the expected filenames (e.g., 1983.jpg, 1984.jpg, etc.)'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (const file of yearImages) {
      try {
        const filename = file.originalFilename || file.newFilename;
        console.log(`Processing file: ${filename}`);
        
        // Validate filename exists in year-images bucket
        if (!existingFilenames.includes(filename)) {
          console.log(`❌ File ${filename} not found in existing files:`, existingFilenames);
          errors.push(`❌ ${filename}: Not a valid year image filename`);
          continue;
        }

        console.log(`✅ File ${filename} validated, proceeding with upload`);

        // Read file data
        const fileBuffer = fs.readFileSync(file.filepath);
        
        // Upload to Supabase Storage (this will replace existing file)
        const { data, error } = await supabase.storage
          .from('year-images')
          .upload(filename, fileBuffer, {
            contentType: file.mimetype,
            upsert: true, // This enables replacement
          });

        if (error) {
          console.error(`Error uploading ${filename}:`, error);
          errors.push(`❌ ${filename}: ${error.message}`);
        } else {
          uploadedFiles.push(filename);
          console.log(`✅ Successfully replaced year image: ${filename}`);
        }

        // Clean up temp file
        fs.unlinkSync(file.filepath);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.originalFilename}:`, fileError);
        errors.push(`❌ ${file.originalFilename}: ${fileError.message}`);
      }
    }

    // Prepare response
    const replacedCount = uploadedFiles.length;
    const hasErrors = errors.length > 0;

    if (replacedCount === 0 && hasErrors) {
      return res.status(400).json({
        success: false,
        message: 'No year images were replaced',
        errors: errors,
        replacedCount: 0
      });
    }

    const responseMessage = hasErrors 
      ? `Replaced ${replacedCount} year images with ${errors.length} errors`
      : `Successfully replaced ${replacedCount} year images`;

    return res.status(200).json({
      success: true,
      message: responseMessage,
      replacedCount: replacedCount,
      replacedFiles: uploadedFiles,
      errors: hasErrors ? errors : undefined
    });

  } catch (error) {
    console.error('Error in upload-year-images API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
} 