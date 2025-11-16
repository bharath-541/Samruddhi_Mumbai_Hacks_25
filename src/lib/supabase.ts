import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './env';

const env = (() => {
  try { return loadEnv(); } catch { return process.env as any; }
})();

export const supabaseAdmin = createClient(
  env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
