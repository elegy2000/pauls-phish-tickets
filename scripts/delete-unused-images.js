// Script to delete unused ticket images from Supabase storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function deleteUnusedImages() {
  console.log('🗑️ DELETING UNUSED TICKET IMAGES');
  console.log('==================================\n');

  try {
    // Get list of unused files from our analysis
    const { data: unusedFiles, error } = await supabase.rpc('exec', {
      sql: `
        WITH used_images AS (
          SELECT DISTINCT image_filename 
          FROM ticket_stubs 
          WHERE image_filename IS NOT NULL 
            AND image_filename != ''
        )
        SELECT so.name
        FROM storage.objects so
        LEFT JOIN used_images ui ON so.name = ui.image_filename
        WHERE so.bucket_id = 'ticket-images'
          AND ui.image_filename IS NULL
        ORDER BY (so.metadata->>'size')::bigint DESC;
      `
    });

    if (error) {
      console.error('❌ Error getting unused files list:', error);
      return;
    }

    const filesToDelete = unusedFiles.map(row => row.name);
    console.log(`📁 Found ${filesToDelete.length} unused files to delete\n`);

    if (filesToDelete.length === 0) {
      console.log('✅ No unused files found!');
      return;
    }

    // Show some examples
    console.log('📋 Sample files to be deleted:');
    filesToDelete.slice(0, 10).forEach(filename => {
      const type = filename.match(/^\d{13}-/) ? 'DUPLICATE' : 'UNUSED';
      console.log(`  ${type}: ${filename}`);
    });
    
    if (filesToDelete.length > 10) {
      console.log(`  ... and ${filesToDelete.length - 10} more files`);
    }
    console.log('');

    // Delete files in batches
    const batchSize = 50;
    let deletedCount = 0;
    let errors = [];

    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      
      console.log(`🗑️ Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filesToDelete.length/batchSize)} (${batch.length} files)...`);
      
      const { data, error } = await supabase.storage
        .from('ticket-images')
        .remove(batch);

      if (error) {
        console.error(`❌ Error deleting batch:`, error);
        errors.push({ batch: Math.floor(i/batchSize) + 1, error });
      } else {
        deletedCount += batch.length;
        console.log(`✅ Successfully deleted ${batch.length} files`);
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 CLEANUP SUMMARY:');
    console.log('===================');
    console.log(`✅ Successfully deleted: ${deletedCount} files`);
    console.log(`❌ Batch errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error details:');
      errors.forEach(err => {
        console.log(`  Batch ${err.batch}: ${err.error.message}`);
      });
    }

    // Calculate space saved (estimated)
    const estimatedSavedMB = Math.round(deletedCount * 0.5); // Rough estimate
    console.log(`💾 Estimated storage freed: ~${estimatedSavedMB} MB`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the deletion
deleteUnusedImages(); 