import React from 'react'

/**
 * HistoryScreen
 * Displays a list of past shopping trips and provides a CTA to start a new one.
 */
export default function HistoryScreen({ sessions = [], onStartNew, onOpenSession, onDeleteSession, loading }) {
  
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Cargando historial...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      
      {/* ── Status / Hero ── */}
      <div className="py-6 text-center">
        <div className="w-16 h-16 bg-brand-500/10 rounded-full mx-auto flex items-center justify-center text-3xl mb-3 ring-1 ring-brand-500/20">
          📜
        </div>
        <h2 className="text-xl font-bold text-white">Tu Historial</h2>
        <p className="text-sm text-gray-500 mt-1">
          {sessions.length === 0 
            ? 'Aún no tienes compras registradas' 
            : `Has realizado ${sessions.length} viajes al súper`}
        </p>
      </div>

      {/* ── CTA: Start New ── */}
      <div className="px-4 mb-8">
        <button
          onClick={onStartNew}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-base shadow-lg shadow-brand-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span className="text-xl">🛒</span>
          Empezar nueva compra
        </button>
      </div>

      {/* ── History List ── */}
      <div className="px-4 space-y-4 pb-24">
        {sessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onOpenSession(session)}
            className="glass-card p-4 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                  {new Date(session.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </span>
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                <span className="text-xs text-gray-500">
                  {new Date(session.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="font-bold text-white text-base leading-tight">
                {session.name}
              </h3>
              <p className="text-sm font-bold text-brand-400 mt-1">
                $ {parseFloat(session.total_spent || 0).toLocaleString('es-CO')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('¿Eliminar este registro permanentemente?')) {
                    onDeleteSession(session.id)
                  }
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
              >
                🗑
              </button>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-brand-500 transition-colors">
                ❯
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
