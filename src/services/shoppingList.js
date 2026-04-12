import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

/**
 * ── SESSION MANAGEMENT ────────────────────────────────────────────────────────
 */

/**
 * Creates a new active shopping session.
 */
export async function createSession(name) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No hay sesión de usuario activa')

  const { data, error } = await supabase
    .from('shopping_sessions')
    .insert([{ 
      user_id: user.id, 
      name: name || `Compra ${new Date().toLocaleDateString()}`,
      status: 'active'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetches the current active session if any.
 */
export async function getActiveSession() {
  if (!isSupabaseConfigured) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('shopping_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Marks a session as completed and records total spent.
 */
export async function completeSession(sessionId, totalSpent) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('shopping_sessions')
    .update({ 
      status: 'completed', 
      total_spent: totalSpent,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetches all completed sessions for history.
 */
export async function fetchSessions() {
  if (!isSupabaseConfigured) return []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('shopping_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Deletes a session and all its items.
 */
export async function deleteSession(sessionId) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('shopping_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw error
}

/**
 * ── ITEM MANAGEMENT ──────────────────────────────────────────────────────────
 */

/**
 * Add a scanned product to the shopping list, linked to a session.
 */
export async function addShoppingItem(item, sessionId) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  if (!sessionId) throw new Error('Se requiere un ID de sesión para guardar el producto')

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('user_shopping_list')
    .insert([{ 
      ...item, 
      user_id: user?.id ?? null,
      session_id: sessionId
    }])
    .select()
    .single()

  if (error) throw error

  // --- CROWDSOURCING ---
  if (item.barcode) {
    const { error: globalError } = await supabase
      .from('global_products')
      .upsert({
        barcode: item.barcode,
        name: item.product_name,
        brand: item.brand || null,
        image_url: item.image_url || null,
        nutriscore: item.nutriscore || null,
        approximate_price: item.price > 0 ? item.price : null,
        created_by: user?.id ?? null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'barcode' })

    if (globalError) {
      console.error('[Crowdsourcing] Error:', globalError)
    }
  }

  return data
}

/**
 * Fetch all items for a specific session.
 */
export async function fetchSessionItems(sessionId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('user_shopping_list')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Delete an item by id.
 */
export async function deleteShoppingItem(id) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase
    .from('user_shopping_list')
    .delete()
    .eq('id', id)

  if (error) throw error
}
