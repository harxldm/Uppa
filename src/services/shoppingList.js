import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

/**
 * Add a scanned product to the shopping list.
 */
export async function addShoppingItem(item) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('user_shopping_list')
    .insert([{ ...item, user_id: user?.id ?? null }])
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
      alert('Error en BD colaborativa: ' + globalError.message)
    }
  }

  return data
}

/**
 * Fetch all items added today for the current user.
 */
export async function fetchTodayItems() {
  if (!isSupabaseConfigured) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('user_shopping_list')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
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
