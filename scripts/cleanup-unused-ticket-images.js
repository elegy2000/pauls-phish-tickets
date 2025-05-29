// Script to identify and clean up unused ticket images from Supabase storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'ticket-images';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function analyzeTicketImageUsage() {
  console.log('🔍 Analyzing ticket image usage...\n');

  try {
    // Get all image filenames currently referenced by tickets in the database
    const { data: usedImages, error: dbError } = await supabase
      .from('ticket_stubs')
      .select('image_filename')
      .neq('image_filename', null)
      .neq('image_filename', '');

    if (dbError) {
      console.error('Error querying database:', dbError);
      return;
    }

    const usedImageNames = new Set(usedImages.map(item => item.image_filename));
    console.log(`📊 Found ${usedImageNames.size} unique images referenced in database`);

    // Get all files currently in the storage bucket
    const { data: storedFiles, error: storageError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 2000 });

    if (storageError) {
      console.error('Error listing storage files:', storageError);
      return;
    }

    console.log(`💾 Found ${storedFiles.length} images in storage bucket\n`);

    // Analyze usage
    const unusedImages = [];
    const duplicateImages = []; // Images with long prefixes
    let totalUnusedSize = 0;

    for (const file of storedFiles) {
      const filename = file.name;
      const sizeKB = file.metadata?.size ? Math.round(file.metadata.size / 1024) : 0;

      // Check for duplicates (files with timestamp prefixes)
      const isDuplicate = /^\d{13}-/.test(filename); // Pattern: 1747968138637-filename
      if (isDuplicate) {
        const originalName = filename.replace(/^\d{13}-/, '');
        duplicateImages.push({
          filename,
          originalName,
          sizeKB,
          created: file.created_at
        });
        totalUnusedSize += sizeKB;
        continue;
      }

      // Check if image is actually used
      if (!usedImageNames.has(filename)) {
        unusedImages.push({
          filename,
          sizeKB,
          created: file.created_at
        });
        totalUnusedSize += sizeKB;
      }
    }

    // Report findings
    console.log('📋 ANALYSIS RESULTS:');
    console.log('==================');
    console.log(`✅ Images in use: ${usedImageNames.size}`);
    console.log(`❌ Unused original images: ${unusedImages.length}`);
    console.log(`🔄 Duplicate images (with timestamp prefixes): ${duplicateImages.length}`);
    console.log(`💰 Total unused storage: ${(totalUnusedSize / 1024).toFixed(2)} MB\n`);

    // Show largest unused files first
    console.log('🗂️ LARGEST UNUSED FILES:');
    console.log('========================');
    const allUnused = [...unusedImages, ...duplicateImages]
      .sort((a, b) => b.sizeKB - a.sizeKB)
      .slice(0, 20);

    allUnused.forEach(file => {
      const type = file.originalName ? 'DUPLICATE' : 'UNUSED';
      console.log(`${type}: ${file.filename} (${file.sizeKB} KB)`);
    });

    console.log('\n🔍 PROBLEM ANALYSIS:');
    console.log('====================');
    
    // Analyze PNGs vs JPGs
    const pngCount = unusedImages.filter(f => f.filename.endsWith('.png')).length + 
                    duplicateImages.filter(f => f.filename.endsWith('.png')).length;
    const jpgCount = unusedImages.filter(f => f.filename.endsWith('.jpg')).length + 
                    duplicateImages.filter(f => f.filename.endsWith('.jpg')).length;
    
    console.log(`📸 PNG files unused: ${pngCount}`);
    console.log(`📸 JPG files unused: ${jpgCount}`);
    console.log(`🔗 Duplicate files (timestamp prefixes): ${duplicateImages.length}`);

    // Show some examples of problematic files
    console.log('\n📋 SAMPLE PROBLEMATIC FILES:');
    console.log('============================');
    
    // Large PNGs
    const largePNGs = unusedImages
      .filter(f => f.filename.endsWith('.png') && f.sizeKB > 1000)
      .sort((a, b) => b.sizeKB - a.sizeKB)
      .slice(0, 5);
    
    if (largePNGs.length > 0) {
      console.log('Large unused PNG files:');
      largePNGs.forEach(f => console.log(`  - ${f.filename} (${f.sizeKB} KB)`));
    }

    // Timestamp duplicates
    if (duplicateImages.length > 0) {
      console.log('\nDuplicate files with timestamps:');
      duplicateImages.slice(0, 5).forEach(f => 
        console.log(`  - ${f.filename} → ${f.originalName} (${f.sizeKB} KB)`)
      );
    }

    return {
      unusedImages,
      duplicateImages,
      totalUnusedSize,
      usedImageNames
    };

  } catch (error) {
    console.error('Error analyzing images:', error);
  }
}

async function cleanupUnusedImages(dryRun = true) {
  const analysis = await analyzeTicketImageUsage();
  if (!analysis) return;

  const { unusedImages, duplicateImages, totalUnusedSize } = analysis;
  const filesToDelete = [...unusedImages, ...duplicateImages];

  console.log(`\n🗑️ CLEANUP ${dryRun ? 'SIMULATION' : 'EXECUTION'}:`);
  console.log('=================================');
  console.log(`📁 Files to delete: ${filesToDelete.length}`);
  console.log(`💾 Storage to free: ${(totalUnusedSize / 1024).toFixed(2)} MB`);

  if (dryRun) {
    console.log('\n⚠️ DRY RUN MODE - No files will be deleted');
    console.log('   Run with dryRun=false to actually delete files');
    return;
  }

  // Batch delete files (Supabase supports up to 100 files per batch)
  const batchSize = 50;
  let deletedCount = 0;
  let errors = [];

  for (let i = 0; i < filesToDelete.length; i += batchSize) {
    const batch = filesToDelete.slice(i, i + batchSize);
    const filenames = batch.map(f => f.filename);

    console.log(`\n🗑️ Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filesToDelete.length/batchSize)}...`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(filenames);

    if (error) {
      console.error(`❌ Error deleting batch:`, error);
      errors.push(error);
    } else {
      deletedCount += filenames.length;
      console.log(`✅ Deleted ${filenames.length} files`);
    }
  }

  console.log(`\n📊 CLEANUP COMPLETE:`);
  console.log(`✅ Successfully deleted: ${deletedCount} files`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`💾 Storage freed: ${(totalUnusedSize / 1024).toFixed(2)} MB`);
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧹 TICKET IMAGE CLEANUP TOOL');
  console.log('=============================\n');
  
  const shouldCleanup = process.argv.includes('--cleanup');
  const dryRun = !process.argv.includes('--execute');
  
  if (shouldCleanup) {
    cleanupUnusedImages(dryRun);
  } else {
    analyzeTicketImageUsage();
  }
}

export { analyzeTicketImageUsage, cleanupUnusedImages }; 