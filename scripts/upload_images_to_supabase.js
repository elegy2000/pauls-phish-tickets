// Usage: node scripts/upload_images_to_supabase.js
// Requires: npm install @supabase/supabase-js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hykzrxjtkpssrfmcerky.supabase.co'; // Your Supabase URL
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3pyeGp0a3Bzc3JmbWNlcmt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQwMjI1OCwiZXhwIjoyMDYyOTc4MjU4fQ.wygJ-fOPH7vAKGqvF3UiSPBBXBlxWE0bRv8anBcVOgE'; // Your Supabase service role key
const BUCKET_NAME = 'ticket-images';
const IMAGES_DIR = path.join(__dirname, '../public/images');
const OUTPUT_MAPPING = path.join(__dirname, 'supabase_image_mapping.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function ensureBucketExists() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (!data.find(b => b.name === BUCKET_NAME)) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    if (createError) throw createError;
    console.log(`Created bucket: ${BUCKET_NAME}`);
  }
}

async function uploadImages() {
  await ensureBucketExists();
  const files = fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith('.'));
  const mapping = {};
  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(file, fileBuffer, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError && !uploadError.message.includes('already exists')) {
      console.error(`Failed to upload ${file}:`, uploadError.message);
      continue;
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file);
    mapping[file] = publicUrlData.publicUrl;
    console.log(`Uploaded and mapped: ${file} -> ${publicUrlData.publicUrl}`);
  }
  fs.writeFileSync(OUTPUT_MAPPING, JSON.stringify(mapping, null, 2));
  console.log(`\nMapping file written to: ${OUTPUT_MAPPING}`);
}

uploadImages().catch(err => {
  console.error('Error uploading images:', err);
  process.exit(1);
}); 