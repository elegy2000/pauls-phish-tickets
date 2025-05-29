// This script creates the year-images bucket and uploads placeholder images for years with ticket data
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'year-images';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Common years that likely have ticket data based on the project
const commonPhishYears = [
  '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990',
  '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
  '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010',
  '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020',
  '2021', '2022', '2023', '2024'
];

async function createBucketAndPlaceholders() {
  try {
    // Create the bucket
    console.log('Creating year-images bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 4194304 // 4MB
      });

    if (bucketError && !bucketError.message?.includes('already exists')) {
      console.error('Failed to create bucket:', bucketError);
      return;
    }

    console.log('✅ Bucket created or already exists');

    // Create a simple placeholder image buffer (1x1 transparent PNG)
    const placeholderBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    // Upload placeholder images for common years
    console.log('Uploading placeholder images...');
    let uploadedCount = 0;
    
    for (const year of commonPhishYears) {
      const filename = `${year}.jpg`;
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filename, placeholderBuffer, { 
          upsert: true, 
          contentType: 'image/jpeg' 
        });

      if (error) {
        console.error(`Failed to upload ${filename}:`, error.message);
      } else {
        console.log(`✅ Uploaded placeholder: ${filename}`);
        uploadedCount++;
      }
    }

    console.log(`\n🎉 Setup complete! Created ${uploadedCount} placeholder year images.`);
    console.log('You can now upload real year images to replace these placeholders.');
    console.log('Expected format: YYYY.jpg (e.g., 1983.jpg, 1984.jpg, etc.)');

  } catch (error) {
    console.error('Error setting up year images:', error);
  }
}

createBucketAndPlaceholders(); 