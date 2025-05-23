const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = 'ticket-images';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Listing images from bucket:', bucket);
    
    const { data: imageList, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 5000, sortBy: { column: 'name', order: 'asc' } });
    
    if (listError) {
      console.error('Error listing images:', listError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error listing images', 
        error: listError.message 
      });
    }

    const imageNames = imageList?.map(img => img.name) || [];
    console.log(`Found ${imageNames.length} images in storage`);
    
    res.status(200).json({ 
      success: true, 
      images: imageNames,
      count: imageNames.length
    });
    
  } catch (error) {
    console.error('Error in list-images API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
} 