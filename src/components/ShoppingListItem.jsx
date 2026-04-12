import React from 'react'
import { deleteShoppingItem } from '../services/shoppingList'

/**
 * ShoppingListItem — a single row in the shopping list.
 */
export default function ShoppingListItem({ item, currencySymbol = '$', onDelete, readOnly = false, onClick }) {
  async function handleDelete() {
    try {
      await deleteShoppingItem(item.id)
    } catch {
      // swallow if not connected to Supabase
    }
    onDelete(item.id)
  }

  const subtotal = (parseFloat(item.price) * (item.quantity || 1)).toFixed(2)

  return (
    <div 
      onClick={() => onClick && onClick(item)}
      className={`flex items-center gap-3 p-3 glass-card animate-fade-in group active:scale-[0.98] transition-all
        ${onClick ? 'cursor-pointer hover:border-brand-500/30' : ''}`}
    >
      {/* Product thumbnail */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.product_name}
          className="w-12 h-12 rounded-xl object-contain bg-surface-700 flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center flex-shrink-0 text-xl">
          🛒
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{item.product_name}</p>
        <p className="text-xs text-gray-500 truncate">{item.brand || '—'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">×{item.quantity || 1}</span>
          {item.nutriscore && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
              ${item.nutriscore === 'A' ? 'bg-green-500 text-white' :
                item.nutriscore === 'B' ? 'bg-lime-400 text-gray-900' :
                item.nutriscore === 'C' ? 'bg-yellow-400 text-gray-900' :
                item.nutriscore === 'D' ? 'bg-orange-500 text-white' :
                item.nutriscore === 'E' ? 'bg-red-600 text-white' :
                'bg-gray-600 text-gray-300'}`}>
              {item.nutriscore}
            </span>
          )}
        </div>
      </div>

      {/* Price + delete */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-bold text-brand-400">{currencySymbol}{subtotal}</span>
        {!readOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            className="text-gray-600 hover:text-red-400 active:text-red-500
                       transition-colors text-xs opacity-0 group-hover:opacity-100 p-1"
            aria-label="Eliminar"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
