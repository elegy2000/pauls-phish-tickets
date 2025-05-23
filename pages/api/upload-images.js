const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs');

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'ticket-images';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey 
  });
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

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
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 8 chars):', supabaseKey ? supabaseKey.slice(0, 8) : 'undefined');
    const { files } = await parseForm(req);
    console.log('Received files:', files); // Debug log
    let images = files.images;
    if (!images) {
      return res.status(400).json({ success: false, message: 'No images uploaded', debug: { files } });
    }
    if (!Array.isArray(images)) images = [images];

    const uploaded = [];
    for (const file of images) {
      // Support both 'filepath' (v2+) and 'path' (v1.x)
      const filePath = file.filepath || file.path;
      if (!filePath) {
        return res.status(400).json({ success: false, message: 'File path missing in upload. Please try again.', debug: { file } });
      }
      const buffer = await fs.promises.readFile(filePath);
      const fileName = `${Date.now()}-${file.originalFilename || file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
        upsert: true,
        contentType: file.mimetype || file.type,
      });
      if (error) {
        return res.status(500).json({ success: false, message: 'Error uploading to Supabase', error: error.message, debug: { file } });
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      uploaded.push({ fileName, url: data.publicUrl });
    }
    res.status(200).json({ success: true, message: 'Images uploaded successfully', files: uploaded });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message, stack: error.stack });
  }
} 