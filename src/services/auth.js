import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/**
 * Sign up with email and password
 */
export async function signUp(email, password) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/**
 * Sign out
 */
export async function signOut() {
  if (!isSupabaseConfigured) return
  await supabase.auth.signOut()
}

/**
 * Fetch user preferences
 */
export async function fetchUserPreferences() {
  if (!isSupabaseConfigured) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = JSON object requested, multiple (or no) rows returned. Meaning no preferences set yet.
    throw error
  }

  return data
}

/**
 * Update (or insert) user preferences
 */
export async function updateUserPreferences(preferences) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}
