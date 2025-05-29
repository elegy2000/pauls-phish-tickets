import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get distinct years from ticket_stubs table, ordered chronologically
    const { data: years, error } = await supabase
      .from('ticket_stubs')
      .select('year')
      .order('year', { ascending: true });

    if (error) {
      throw error;
    }

    // Extract unique years and sort them
    const availableYears = [...new Set(years.map(row => row.year))]
      .filter(year => year && year.trim()) // Remove any null/empty years
      .sort((a, b) => parseInt(a) - parseInt(b)); // Sort numerically

    res.status(200).json({ years: availableYears });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({ error: 'Failed to fetch available years' });
  }
} 