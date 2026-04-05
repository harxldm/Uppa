import React, { useState } from 'react'
import { updateUserPreferences } from '../services/auth'

export default function OnboardingScreen({ onComplete }) {
  const [language, setLanguage] = useState('es')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      await updateUserPreferences({
        currency: 'COP',
        language,
        setup_completed: true
      })
      onComplete({ currency: 'COP', language, setup_completed: true })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al guardar configuración.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col justify-center px-6 py-12 safe-top safe-bottom">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500/20 rounded-full mx-auto flex items-center justify-center text-3xl mb-4 text-brand-400">
            ⚙️
          </div>
          <h2 className="text-2xl font-bold text-white">Último paso</h2>
          <p className="text-sm text-gray-400 mt-2">
            Configuremos tus preferencias para brindarte la mejor experiencia ahorrando.
          </p>
        </div>

        <div className="glass-card p-6 space-y-6 animate-slide-up">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Idioma preferido
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: 'es', label: 'Español' },
                { code: 'en', label: 'English' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all
                    ${language === lang.code 
                      ? 'bg-brand-500/20 border-brand-500 text-brand-400' 
                      : 'bg-surface-800 border-white/5 text-gray-400 hover:bg-surface-700'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-brand-500 text-white font-bold shadow-lg shadow-brand-900/40 hover:bg-brand-400 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Guardando...' : 'Comenzar a ahorrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
