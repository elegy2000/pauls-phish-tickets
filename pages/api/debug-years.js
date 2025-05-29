import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all years from ticket_stubs table with counts
    const { data: yearData, error } = await supabase
      .from('ticket_stubs')
      .select('year')
      .order('year', { ascending: true });

    if (error) {
      throw error;
    }

    // Count occurrences of each year
    const yearCounts = {};
    yearData.forEach(row => {
      const year = row.year;
      const yearStr = String(year);
      if (!yearCounts[yearStr]) {
        yearCounts[yearStr] = { 
          year: yearStr, 
          originalType: typeof year,
          count: 0 
        };
      }
      yearCounts[yearStr].count++;
    });

    // Get unique years and sort them
    const availableYears = Object.keys(yearCounts)
      .filter(year => year && year.trim())
      .sort((a, b) => parseInt(a) - parseInt(b));

    res.status(200).json({ 
      availableYears,
      yearCounts,
      totalRecords: yearData.length,
      uniqueYears: availableYears.length
    });
  } catch (error) {
    console.error('Error fetching debug years:', error);
    res.status(500).json({ error: 'Failed to fetch debug years' });
  }
} 