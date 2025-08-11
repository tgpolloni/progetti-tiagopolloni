import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client with proper environment handling
let supabase: ReturnType<typeof createClient>;

// Check if we have valid credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== '' && supabaseAnonKey !== '' &&
  !supabaseUrl.includes('xyzcompany');

if (hasValidCredentials) {
  // Use real Supabase client with valid credentials
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Create a dummy client that will fail gracefully
  console.warn('Supabase credentials not configured. Authentication will not work.');
  supabase = createClient('https://dummy.supabase.co', 'dummy-key');
}

export { supabase };

export default supabase;