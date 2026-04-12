import React, { useState } from 'react'
import NutriScoreBadge from './NutriScoreBadge'
import { addShoppingItem } from '../services/shoppingList'

/**
 * ProductCard
 * Shows scanned product details and lets the user input a price before saving.
 * When product.isManual === true, name and brand become editable inputs.
 */
export default function ProductCard({ product, currencySymbol = '$', onSave, onDismiss }) {
  // Pre-fill the price if we got an approximatePrice from the crowdsourced DB
  const [price, setPrice]       = useState(product.approximatePrice ? product.approximatePrice.toString() : '')
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving]     = useState(false)
  const [imgError, setImgError] = useState(false)

  // Manual-entry editable fields (only used when isManual === true)
  const [manualName, setManualName]   = useState(product.name   || '')
  const [manualBrand, setManualBrand] = useState(product.brand  || '')

  const isManual = !!product.isManual

  const displayName  = isManual ? manualName  : product.name
  const displayBrand = isManual ? manualBrand : product.brand

  function handleSave() {
    const numPrice   = parseFloat(price) || 0
    const finalName  = isManual ? manualName.trim()  : product.name
    const finalBrand = isManual ? manualBrand.trim() : product.brand

    onSave({
      barcode:      product.barcode,
      product_name: finalName  || 'Producto sin nombre',
      brand:        finalBrand || '',
      image_url:    product.imageUrl,
      nutriscore:   product.nutriScore,
      price:        numPrice,
      quantity,
    })
  }

  return (
    <div className="animate-bounce-in glass-card overflow-hidden">

      {/* Product image — hidden in manual mode (no image) */}
      {!isManual && product.imageUrl && !imgError ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-44 object-contain bg-surface-700 p-4"
        />
      ) : !isManual ? (
        <div className="w-full h-32 bg-surface-700 flex items-center justify-center">
          <span className="text-4xl">🛒</span>
        </div>
      ) : null}

      <div className="p-4 space-y-4">

        {/* ── Header ── */}
        {isManual ? (
          /* Editable fields in manual mode */
          <div className="space-y-3">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                Nombre del producto *
              </label>
              <input
                type="text"
                placeholder="Ej: Leche entera 1L"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px solid ${manualName ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  background: 'rgba(255,255,255,0.04)',
                  color: '#f9fafb',
                  fontSize: 15,
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                Marca (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Alpura"
                value={manualBrand}
                onChange={e => setManualBrand(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#d1d5db',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <p className="text-xs text-gray-600 font-mono">{product.barcode}</p>
          </div>
        ) : (
          /* Normal display mode */
          <div>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-0.5">
              {displayBrand}
            </p>
            <h2 className="font-bold text-lg leading-tight text-white line-clamp-2">
              {displayName}
            </h2>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <NutriScoreBadge grade={product.nutriScore} />
              <span className="text-xs text-gray-500 font-mono">{product.barcode}</span>
              {product.source && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#4b5563',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    padding: '1px 6px',
                  }}
                >
                  {product.source}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price & Quantity row */}
        <div className="flex gap-3">
          {/* Price input */}
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1 font-medium">Precio</label>
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
            disabled={saving || (isManual && !manualName.trim())}
            className="flex-[2] py-3 rounded-xl bg-brand-500 text-white text-sm font-bold
                       hover:bg-brand-400 active:scale-[0.98] transition-all disabled:opacity-50
                       disabled:cursor-not-allowed shadow-lg shadow-brand-900/40"
          >
            {saving ? 'Agregando…' : '+ Agregar a la lista'}
          </button>
        </div>

        {isManual && !manualName.trim() && (
          <p className="text-xs text-gray-600 text-center -mt-2">
            Escribe al menos el nombre del producto para continuar
          </p>
        )}
      </div>
    </div>
  )
}
