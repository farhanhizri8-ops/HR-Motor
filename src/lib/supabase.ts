import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('https://') &&
  (supabaseAnonKey || supabaseServiceRoleKey) &&
  (supabaseAnonKey.length > 10 || supabaseServiceRoleKey.length > 10)
);

// Client-side Supabase instance (using anon key)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    })
  : null;

// Server-side Supabase instance (prefers service role key if available for full RLS bypass)
export function getServerSupabase() {
  if (!isSupabaseConfigured) return null;
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseConfigInfo() {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+)\..*$/, '$1.supabase.co') : '',
    hasAnonKey: Boolean(supabaseAnonKey),
    hasServiceKey: Boolean(supabaseServiceRoleKey),
  };
}
