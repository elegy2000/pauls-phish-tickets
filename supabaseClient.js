import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hykzrxjtkpssrfmcerky.supabase.co';
const supabaseKey = 'sbp_9e43403238de8faed4a3d1d85b3bc72dbc4d52c9';

export const supabase = createClient(supabaseUrl, supabaseKey);