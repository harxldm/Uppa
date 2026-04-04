import React, { useState } from 'react'
import { signIn, signUp } from '../services/auth'

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('Revisa tu correo para verificar tu cuenta (si tienes activada la confirmación en Supabase), o inicia sesión.')
      }
    } catch (err) {
      setError(err.message || 'Ha ocurrido un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col justify-center px-6 py-12 safe-top safe-bottom">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-surface-800 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-brand-500/10 mb-6">
            🛍
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Bienvenido a <span className="text-brand-400">Uppa</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Ahorra en el super, siempre.
          </p>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
            
            {message && (
              <div className="p-3 bg-brand-900/30 border border-brand-500/30 rounded-lg">
                <p className="text-xs text-brand-300">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-bold tracking-wide shadow-lg shadow-brand-900/40 hover:bg-brand-400 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setMessage(null)
                }}
                className="text-brand-400 font-semibold hover:text-brand-300 transition-colors"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
