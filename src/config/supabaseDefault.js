// Default Supabase Credentials Fallback
// You can enter your default Supabase URL & Key here or in .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).
// This enables all devices to connect automatically out-of-the-box without manual entry.

export const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
