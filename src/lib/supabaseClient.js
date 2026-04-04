import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Placeholder values so Supabase client doesn't throw when env vars are missing.
// All DB calls will fail gracefully; the app uses local state as fallback.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing env vars. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'The app will run in offline/local mode until configured.'
  )
}

export const supabase = createClient(
  supabaseUrl     || PLACEHOLDER_URL,
  supabaseAnonKey || PLACEHOLDER_KEY
)

/** True when Supabase is properly configured */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)
