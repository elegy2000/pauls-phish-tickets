import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Analyzing unused ticket images...');

    // Get all image filenames currently referenced by tickets
    const { data: usedImages, error: dbError } = await supabase
      .from('ticket_stubs')
      .select('image_filename')
      .neq('image_filename', null)
      .neq('image_filename', '');

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get used images from database' 
      });
    }

    const usedImageNames = new Set(usedImages.map(item => item.image_filename));
    console.log(`Found ${usedImageNames.size} images referenced in database`);

    // Get all files in storage
    const { data: storedFiles, error: storageError } = await supabase.storage
      .from('ticket-images')
      .list('', { limit: 2000 });

    if (storageError) {
      console.error('Storage error:', storageError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to list storage files' 
      });
    }

    console.log(`Found ${storedFiles.length} files in storage`);

    // Identify unused files
    const unusedFiles = [];
    let totalUnusedSize = 0;

    for (const file of storedFiles) {
      const filename = file.name;
      const isDuplicate = /^\d{13}-/.test(filename); // Timestamp prefix duplicates
      const isUsed = usedImageNames.has(filename);

      if (!isUsed || isDuplicate) {
        const sizeKB = file.metadata?.size ? Math.round(file.metadata.size / 1024) : 0;
        unusedFiles.push({
          name: filename,
          size: sizeKB,
          type: isDuplicate ? 'duplicate' : 'unused'
        });
        totalUnusedSize += sizeKB;
      }
    }

    console.log(`Found ${unusedFiles.length} unused files (${(totalUnusedSize/1024).toFixed(2)} MB)`);

    if (unusedFiles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unused files found',
        deletedCount: 0,
        savedSpace: 0
      });
    }

    // Delete files in batches
    const batchSize = 50;
    let deletedCount = 0;
    let errors = [];

    for (let i = 0; i < unusedFiles.length; i += batchSize) {
      const batch = unusedFiles.slice(i, i + batchSize);
      const filenames = batch.map(f => f.name);

      console.log(`Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(unusedFiles.length/batchSize)}...`);
      
      const { data, error } = await supabase.storage
        .from('ticket-images')
        .remove(filenames);

      if (error) {
        console.error(`Error deleting batch:`, error);
        errors.push(error);
      } else {
        deletedCount += filenames.length;
        console.log(`Successfully deleted ${filenames.length} files`);
      }
    }

    const savedSpaceMB = (totalUnusedSize / 1024).toFixed(2);

    return res.status(200).json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedCount,
      savedSpace: `${savedSpaceMB} MB`,
      errors: errors.length,
      breakdown: {
        duplicates: unusedFiles.filter(f => f.type === 'duplicate').length,
        unused: unusedFiles.filter(f => f.type === 'unused').length
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during cleanup'
    });
  }
} 