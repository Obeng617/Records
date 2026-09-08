const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('example.supabase.co')) {
  console.warn('\n===============================================================');
  console.warn('⚠️  WARNING: Valid Supabase environment variables missing in .env!');
  console.warn('Please update backend/.env with your real SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY');
  console.warn('===============================================================\n');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = supabase;
