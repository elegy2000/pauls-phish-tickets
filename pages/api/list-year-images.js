import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // List all files from the year-images bucket
    const { data: files, error } = await supabase.storage
      .from('year-images')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error listing year images:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to list year images',
        error: error.message 
      });
    }

    // Filter out any directories and extract just filenames
    const imageFiles = files
      ? files
          .filter(file => file.name && !file.name.endsWith('/'))
          .map(file => file.name)
      : [];

    console.log('Found year images:', imageFiles);

    return res.status(200).json({
      success: true,
      images: imageFiles,
      count: imageFiles.length
    });

  } catch (error) {
    console.error('Error in list-year-images API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
} 