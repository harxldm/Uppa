/**
 * openFoodFacts.js
 * Service layer for the Open Food Facts REST API v2.
 */

const BASE_URL = 'https://world.openfoodfacts.org/api/v2/product'

/**
 * Fetch product info by barcode from Open Food Facts.
 * @param {string} barcode  EAN-13 / UPC-A / UPC-E code
 * @returns {Promise<ProductInfo|null>}
 */
export async function fetchProduct(barcode) {
  try {
    const fields = 'product_name,brands,image_front_url,nutriscore_grade'
    const res = await fetch(`${BASE_URL}/${barcode}.json?fields=${fields}`)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return null   // product not found
    }

    const p = data.product

    return {
      barcode,
      name:       p.product_name || 'Producto desconocido',
      brand:      p.brands       || 'Marca desconocida',
      imageUrl:   p.image_front_url || null,
      nutriScore: (p.nutriscore_grade || '').toUpperCase() || null,
    }
  } catch (err) {
    console.error('[OpenFoodFacts] Error fetching product:', err)
    throw err
  }
}
