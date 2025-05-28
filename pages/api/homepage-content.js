import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get homepage content
      const { data, error } = await supabase
        .from('homepage_content')
        .select('content_text')
        .eq('content_key', 'opening_paragraph')
        .single();

      if (error) {
        console.error('Error fetching homepage content:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch homepage content' 
        });
      }

      return res.status(200).json({
        success: true,
        content: data?.content_text || ''
      });

    } catch (error) {
      console.error('Error in homepage-content GET:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Content is required and must be a string'
        });
      }

      // Update homepage content
      const { data, error } = await supabase
        .from('homepage_content')
        .update({ 
          content_text: content,
          updated_at: new Date().toISOString()
        })
        .eq('content_key', 'opening_paragraph')
        .select();

      if (error) {
        console.error('Error updating homepage content:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update homepage content'
        });
      }

      console.log('Homepage content updated successfully');

      return res.status(200).json({
        success: true,
        message: 'Homepage content updated successfully',
        content: data?.[0]?.content_text
      });

    } catch (error) {
      console.error('Error in homepage-content POST:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    message: 'Method not allowed' 
  });
} 