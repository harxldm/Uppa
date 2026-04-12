import React from 'react'
import ShoppingListItem from './ShoppingListItem'

/**
 * SessionDetail
 * Shows a read-only list of items from a past shopping trip.
 */
export default function SessionDetail({ session, items = [], onBack, currencySymbol = '$', onAnalysis }) {
  const dateStr = session ? new Date(session.created_at).toLocaleDateString('es-CO', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }) : ''

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative">
      
      {/* ── Header ── */}
      <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-surface-900/50 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-800 text-gray-400 active:scale-90 transition-all font-bold"
        >
          ❮
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{session?.name}</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{dateStr}</p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-300 font-semibold uppercase tracking-wider">Inversión Total</span>
            <span className="text-2xl font-black text-brand-400">
              {currencySymbol}{parseFloat(session?.total_spent || 0).toLocaleString('es-CO')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
            <span className="text-xs text-gray-400">{items.length} artículos comprados</span>
          </div>
        </div>

        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 px-1">Detalle del recibo</h3>
        <div className="space-y-3 pb-20">
          {items.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No hay artículos en este registro.</p>
          ) : (
            items.map(item => (
              <ShoppingListItem 
                key={item.id} 
                item={item} 
                currencySymbol={currencySymbol} 
                readOnly={true} 
                onClick={onAnalysis}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
