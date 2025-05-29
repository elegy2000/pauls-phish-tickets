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

    const [fields, files] = await form.parse(req);
    
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
      return res.status(500).json({
        success: false,
        message: 'Failed to validate against existing images'
      });
    }

    const existingFilenames = existingFiles ? existingFiles.map(f => f.name) : [];
    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (const file of yearImages) {
      try {
        const filename = file.originalFilename || file.newFilename;
        
        // Validate filename exists in year-images bucket
        if (!existingFilenames.includes(filename)) {
          errors.push(`❌ ${filename}: Not a valid year image filename`);
          continue;
        }

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