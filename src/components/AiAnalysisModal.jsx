import React, { useState, useEffect } from 'react'
import { getProductAnalysis } from '../services/aiAdvisor'

/**
 * AiAnalysisModal
 * Enhanced product detail modal that shows instant nutritional data 
 * and a premium AI advisor section with loading states.
 */
export default function AiAnalysisModal({ product, onClose, aiDetailLevel = 2 }) {
  const [loadingAi, setLoadingAi] = useState(true)
  const [aiError, setAiError] = useState(null)
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoadingAi(true)
        setAiError(null)
        const data = await getProductAnalysis(product, aiDetailLevel)
        setAnalysis(data)
      } catch (err) {
        setAiError(err.message)
      } finally {
        setLoadingAi(false)
      }
    }
    loadAnalysis()
  }, [product])

  const getVerdictTheme = (v = '') => {
    const lower = v.toLowerCase()
    if (lower.includes('excelente') || lower.includes('muy bueno') || lower.includes('buen')) return { text: 'text-green-400', icon: '✅' }
    if (lower.includes('modera') || lower.includes('poco') || lower.includes('ocasional') || lower.includes('regular')) return { text: 'text-yellow-400', icon: '⚠️' }
    return { text: 'text-red-400', icon: '🚫' }
  }

  const theme = getVerdictTheme(analysis?.veredicto)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface-800 rounded-t-3xl p-6 pb-12 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-surface-700 rounded-full mx-auto mb-6 opacity-30" />

        {/* ── SECCIÓN 1: DATOS INSTANTÁNEOS ── */}
        <div className="flex items-start gap-4 mb-6">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="w-20 h-20 rounded-2xl object-contain bg-surface-900 border border-white/5" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-surface-900 flex items-center justify-center text-3xl border border-white/5">🛒</div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white leading-tight mb-1">{product.product_name}</h2>
            <p className="text-sm text-gray-400 mb-2">{product.brand || 'Marca no disponible'}</p>
            {product.nutriscore && (
              <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider
                ${product.nutriscore === 'A' ? 'bg-green-500 text-white' :
                  product.nutriscore === 'B' ? 'bg-lime-400 text-gray-900' :
                    product.nutriscore === 'C' ? 'bg-yellow-400 text-gray-900' :
                      product.nutriscore === 'D' ? 'bg-orange-500 text-white' :
                        'bg-red-600 text-white'}`}>
                Nutri-Score {product.nutriscore}
              </span>
            )}
          </div>
        </div>

        {/* Tabla Nutricional Instantánea */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-surface-900/50 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Azúcares</p>
            <p className="text-lg font-black text-white">{product.nutriments?.sugar ? `${product.nutriments.sugar}g` : '—'}</p>
          </div>
          <div className="bg-surface-900/50 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Sal / Sodio</p>
            <p className="text-lg font-black text-white">{product.nutriments?.salt ? `${product.nutriments.salt}g` : '—'}</p>
          </div>
          <div className="bg-surface-900/50 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Calorías</p>
            <p className="text-lg font-black text-white">{product.nutriments?.energy ? `${Math.round(product.nutriments.energy)} kcal` : '—'}</p>
          </div>
          <div className="bg-surface-900/50 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Grasas</p>
            <p className="text-lg font-black text-white">{product.nutriments?.fat ? `${product.nutriments.fat}g` : '—'}</p>
          </div>
        </div>

        {/* ── SECCIÓN 2: UPPA AI ADVISOR (PREMIUM) ── */}
        <div className="rainbow-container mb-8">
          <div className="rainbow-border" />
          <div className="rainbow-content p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✨</span>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Uppa.ia</h3>
            </div>

            {loadingAi ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500 animate-pulse">Consultando con la IA...</p>
              </div>
            ) : aiError ? (
              <div className="py-4 text-center">
                <p className="text-xs text-red-400 mb-3">No pudimos conectar con la IA.</p>
                <button
                  onClick={(e) => { e.stopPropagation(); /* trigger reload? */ }}
                  className="text-[10px] font-bold text-white bg-surface-700 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  REINTENTAR
                </button>
              </div>
            ) : (
              <div className="animate-fade-in space-y-5">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-2xl">{theme.icon}</span>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Veredicto</p>
                    <p className={`font-black ${theme.text}`}>{analysis.veredicto}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Análisis</p>
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">"{analysis.analisis}"</p>
                </div>

                <div className="bg-brand-500/10 p-3 rounded-xl border border-brand-500/20">
                  <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-1.5">Alternativa Recomendada</p>
                  <p className="text-sm text-brand-100 font-bold">💡 {analysis.alternativa}</p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 font-bold italic">Tip: {analysis.tip}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-white text-surface-900 font-black text-lg active:scale-95 transition-all shadow-xl shadow-white/5"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
