import React, { useState } from 'react'
import NutriScoreBadge from './NutriScoreBadge'
import { addShoppingItem } from '../services/shoppingList'

/**
 * ProductCard
 * Shows scanned product details and lets the user input a price before saving.
 * @param {{ product: ProductInfo, currencySymbol: string, onSave: (item) => void, onDismiss: () => void }} props
 */
export default function ProductCard({ product, currencySymbol = '$', onSave, onDismiss }) {
  const [price, setPrice]       = useState('')
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving]     = useState(false)
  const [imgError, setImgError] = useState(false)

  async function handleSave() {
    const numPrice = parseFloat(price) || 0
    setSaving(true)
    try {
      const item = await addShoppingItem({
        barcode:      product.barcode,
        product_name: product.name,
        brand:        product.brand,
        image_url:    product.imageUrl,
        nutriscore:   product.nutriScore,
        price:        numPrice,
        quantity,
      })
      onSave(item)
    } catch (err) {
      console.error('[ProductCard] save error:', err)
      // If Supabase is not configured, still add locally
      onSave({
        id:           crypto.randomUUID(),
        barcode:      product.barcode,
        product_name: product.name,
        brand:        product.brand,
        image_url:    product.imageUrl,
        nutriscore:   product.nutriScore,
        price:        numPrice,
        quantity,
        created_at:   new Date().toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-bounce-in glass-card overflow-hidden">
      {/* Product image */}
      {product.imageUrl && !imgError ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-44 object-contain bg-surface-700 p-4"
        />
      ) : (
        <div className="w-full h-32 bg-surface-700 flex items-center justify-center">
          <span className="text-4xl">🛒</span>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-0.5">
            {product.brand}
          </p>
          <h2 className="font-bold text-lg leading-tight text-white line-clamp-2">
            {product.name}
          </h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <NutriScoreBadge grade={product.nutriScore} />
            <span className="text-xs text-gray-500 font-mono">{product.barcode}</span>
          </div>
        </div>

        {/* Price & Quantity row */}
        <div className="flex gap-3">
          {/* Price input */}
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1 font-medium">Precio (MXN)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 font-bold text-sm">{currencySymbol}</span>
              <input
                id="price-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 bg-surface-700 rounded-xl border border-white/10
                           text-white text-sm placeholder-gray-600 focus:outline-none
                           focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30
                           transition-all"
              />
            </div>
          </div>

          {/* Quantity stepper */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Cant.</label>
            <div className="flex items-center gap-1 bg-surface-700 rounded-xl border border-white/10 p-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300
                           hover:bg-surface-600 active:bg-surface-600 transition-colors font-bold"
              >−</button>
              <span className="w-6 text-center text-sm font-semibold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300
                           hover:bg-surface-600 active:bg-surface-600 transition-colors font-bold"
              >+</button>
            </div>
          </div>
        </div>

        {/* Subtotal preview */}
        {price && (
          <div className="flex justify-between items-center rounded-xl bg-brand-500/10 border border-brand-500/20 px-3 py-2">
            <span className="text-xs text-brand-300">Subtotal</span>
            <span className="text-sm font-bold text-brand-400">
              {currencySymbol}{(parseFloat(price) * quantity).toFixed(2)}
            </span>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-xl bg-surface-700 text-gray-300 text-sm font-semibold
                       hover:bg-surface-600 active:scale-[0.98] transition-all"
          >
            Cancelar
          </button>
          <button
            id="add-to-list-btn"
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-3 rounded-xl bg-brand-500 text-white text-sm font-bold
                       hover:bg-brand-400 active:scale-[0.98] transition-all disabled:opacity-50
                       disabled:cursor-not-allowed shadow-lg shadow-brand-900/40"
          >
            {saving ? 'Agregando…' : '+ Agregar a la lista'}
          </button>
        </div>
      </div>
    </div>
  )
}
