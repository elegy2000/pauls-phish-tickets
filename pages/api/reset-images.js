const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'ticket-images';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Starting image bucket reset...');
    
    // List all files in the bucket
    const { data: fileList, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 5000, sortBy: { column: 'name', order: 'asc' } });
    
    if (listError) {
      console.error('Error listing files:', listError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error listing files', 
        error: listError.message 
      });
    }

    if (!fileList || fileList.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No images to delete',
        deletedCount: 0
      });
    }

    console.log(`Found ${fileList.length} files to delete`);
    
    // Delete all files
    const filePaths = fileList.map(file => file.name);
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filePaths);
    
    if (deleteError) {
      console.error('Error deleting files:', deleteError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error deleting files', 
        error: deleteError.message 
      });
    }

    console.log(`Successfully deleted ${filePaths.length} files`);
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${filePaths.length} images from bucket`,
      deletedCount: filePaths.length
    });
    
  } catch (error) {
    console.error('Error resetting image bucket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
} 