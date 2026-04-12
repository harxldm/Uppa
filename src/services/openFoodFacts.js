/**
 * productLookup.js
 * Multi-source product lookup: Supabase (Crowdsourced) → Open Food Facts → UPC Item DB fallback.
 */
import { supabase } from '../lib/supabaseClient'

// ── Source 0: Supabase Global DB (Crowdsourced) ─────────────────────────────
async function fetchFromSupabase(barcode) {
  try {
    const { data, error } = await supabase
      .from('global_products')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (error || !data) return null

    return {
      barcode,
      name:              data.name,
      brand:             data.brand || '',
      imageUrl:          data.image_url || null,
      nutriScore:        data.nutriscore || null,
      approximatePrice:  data.approximate_price ? parseFloat(data.approximate_price) : null,
      source:            'Comunidad Uppa',
    }
  } catch (err) {
    console.warn('[fetchFromSupabase] fallback error:', err)
    return null
  }
}

// ── Source 1: Open Food Facts ───────────────────────────────────────────────
async function fetchFromOpenFoodFacts(barcode) {
  const fields = 'product_name,brands,image_front_url,nutriscore_grade,ingredients_text,nutriments'
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`
  )

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`OFX HTTP ${res.status}`)

  const data = await res.json()
  if (data.status !== 1 || !data.product) return null

  const p = data.product
  return {
    barcode,
    name:       p.product_name  || '',
    brand:      p.brands        || '',
    imageUrl:   p.image_front_url || null,
    nutriScore: (p.nutriscore_grade || '').toUpperCase() || null,
    ingredients: p.ingredients_text || '',
    nutriments: {
      sugar:  p.nutriments?.sugars_100g,
      salt:   p.nutriments?.salt_100g,
      fat:    p.nutriments?.fat_100g,
      energy: p.nutriments?.['energy-kcal_100g'],
    },
    source:     'OpenFoodFacts',
  }
}

// ── Source 2: UPC Item DB (free trial – 100 req/day) ───────────────────────
async function fetchFromUpcItemDb(barcode) {
  const res = await fetch(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`
  )

  // 429 = rate-limited, treat as "not found" to avoid breaking the flow
  if (res.status === 404 || res.status === 429) return null
  if (!res.ok) throw new Error(`UPC HTTP ${res.status}`)

  const data = await res.json()
  if (data.code !== 'OK' || !data.items || data.items.length === 0) return null

  const item = data.items[0]
  return {
    barcode,
    name:       item.title  || '',
    brand:      item.brand  || '',
    imageUrl:   (item.images && item.images[0]) || null,
    nutriScore: null,
    source:     'UpcItemDb',
  }
}

// ── Public API ──────────────────────────────────────────────────────────────
/**
 * Try each source in order. Returns the first hit, or null if none found.
 * @param {string} barcode
 * @returns {Promise<ProductInfo|null>}
 */
export async function fetchProduct(barcode) {
  // 0. Supabase (Crowdsourced)
  try {
    const result = await fetchFromSupabase(barcode)
    if (result) return result
  } catch (err) {
    console.warn('[fetchProduct] Supabase lookup failed:', err.message)
  }

  // 1. Open Food Facts
  try {
    const result = await fetchFromOpenFoodFacts(barcode)
    if (result) return result
  } catch (err) {
    console.warn('[fetchProduct] OFX failed:', err.message)
  }

  // 2. UPC Item DB fallback
  try {
    const result = await fetchFromUpcItemDb(barcode)
    if (result) return result
  } catch (err) {
    console.warn('[fetchProduct] UpcItemDb failed:', err.message)
  }

  // Nothing found in any source
  return null
}
