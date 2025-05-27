// Uploads the homepage logo to the Supabase Storage bucket 'site-assets'.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'site-assets';
const localLogoPath = path.join(process.cwd(), 'public/images/logo.png');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const fileBuffer = fs.readFileSync(localLogoPath);
  const { error } = await supabase.storage.from(bucket).upload('logo.png', fileBuffer, { upsert: true, contentType: 'image/png' });
  if (error) {
    console.error('Failed to upload logo:', error.message);
  } else {
    console.log('Uploaded logo.png');
  }
}

main().catch(console.error); 