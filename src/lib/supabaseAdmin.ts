import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Durante il build, le variabili potrebbero non essere disponibili
// Creiamo un client dummy per evitare errori di build
const supabaseAdmin = supabaseUrl && serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false
      }
    })
  : createClient('https://dummy.supabase.co', 'dummy-key', {
      auth: {
        persistSession: false
      }
    });

export { supabaseAdmin };
export default supabaseAdmin;


