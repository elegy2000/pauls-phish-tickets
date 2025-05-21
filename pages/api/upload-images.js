import { createClient } from '@supabase/supabase-js';
const formidable = require('formidable');
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'ticket-images';

const supabase = createClient(supabaseUrl, supabaseKey);

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const { files } = await parseForm(req);
    let images = files.images;
    if (!images) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }
    if (!Array.isArray(images)) images = [images];

    const uploaded = [];
    for (const file of images) {
      const fileData = await fs.promises.readFile(file.filepath);
      const fileName = `${Date.now()}-${file.originalFilename}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, fileData, {
        upsert: true,
        contentType: file.mimetype,
      });
      if (error) {
        return res.status(500).json({ success: false, message: 'Error uploading to Supabase', error: error.message });
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      uploaded.push({ fileName, url: data.publicUrl });
    }
    res.status(200).json({ success: true, message: 'Images uploaded successfully', files: uploaded });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
} 