// This script uploads all images in public/images/years/ to the Supabase Storage bucket 'year-images'.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'year-images';
const localDir = path.join(process.cwd(), 'public/images/years');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const files = fs.readdirSync(localDir).filter(f => f.endsWith('.jpg'));
  for (const file of files) {
    const filePath = path.join(localDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    const { error } = await supabase.storage.from(bucket).upload(file, fileBuffer, { upsert: true, contentType: 'image/jpeg' });
    if (error) {
      console.error(`Failed to upload ${file}:`, error.message);
    } else {
      console.log(`Uploaded ${file}`);
    }
  }
}

main().catch(console.error); 