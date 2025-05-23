const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Set these to match your environment
const supabaseUrl = 'https://hykzrxjtkpssrfmcerky.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'ticket-images';

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadTestImage() {
  const testImagePath = path.join(__dirname, 'test-image.jpg'); // Place a small test image in the same directory
  if (!fs.existsSync(testImagePath)) {
    console.error('Test image not found:', testImagePath);
    process.exit(1);
  }
  const buffer = fs.readFileSync(testImagePath);
  const fileName = `test-upload-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) {
    console.error('Error uploading to Supabase:', error.message);
    process.exit(1);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  console.log('Upload successful! Public URL:', data.publicUrl);
}

uploadTestImage(); 