import React, { useState, useCallback, useEffect } from 'react'
import BarcodeScanner from './components/BarcodeScanner'
import ProductCard    from './components/ProductCard'
import ShoppingListItem from './components/ShoppingListItem'
import LoginScreen    from './components/LoginScreen'
import OnboardingScreen from './components/OnboardingScreen'
import { fetchProduct } from './services/openFoodFacts'
import { fetchTodayItems, addShoppingItem } from './services/shoppingList'
import { fetchUserPreferences, signOut } from './services/auth'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'

// ── View states (Main App) ─────────────────────────────────────────────────────────
const VIEW = {
  HOME:    'HOME',
  SCANNER: 'SCANNER',
  PRODUCT: 'PRODUCT',
}

// ── Master Component ───────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined)
  const [preferences, setPreferences] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadingAuth(false)
      return
    }

    // Initial session grab
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadConfig()
      } else {
        setLoadingAuth(false)
      }
    })

    // Listen to Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess)
        if (sess) {
          loadConfig()
        } else {
          setPreferences(null)
          setLoadingAuth(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadConfig = async () => {
    try {
      const prefs = await fetchUserPreferences()
      setPreferences(prefs)
    } catch (err) {
      console.error('Error fetching config:', err)
    } finally {
      setLoadingAuth(false)
    }
  }

  // Graceful offline degradation 
  if (!isSupabaseConfigured) {
    return <MainApp /> 
  }

  // Loader while checking session
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // 1. Not logged in
  if (!session) {
    return <LoginScreen />
  }

  // 2. Logged in, but hasn't completed onboarding
  if (!preferences || !preferences.setup_completed) {
    return <OnboardingScreen onComplete={(p) => setPreferences(p)} />
  }

  // 3. Logged in and configured -> Main App
  return <MainApp preferences={preferences} />
}

// ── Sub-component for the Core Logic ───────────────────────────────────────
function MainApp({ preferences = { currency: 'MXN' } }) {
  const [view, setView]       = useState(VIEW.HOME)
  const [product, setProduct] = useState(null)
  const [items, setItems]     = useState([])
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [scanError, setScanError]           = useState(null)

  const currencySymbol = preferences.currency === 'EUR' ? '€' : '$'

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar sesión?')) {
      signOut()
    }
  }

  // Load today's list on mount
  useEffect(() => {
    fetchTodayItems()
      .then(setItems)
      .catch(() => {})
  }, [])

  // Computed total
  const total = items.reduce(
    (acc, item) => acc + parseFloat(item.price) * (item.quantity || 1),
    0
  )

  // Scanner callback
  const handleBarcodeScan = useCallback(async (barcode) => {
    if (loadingProduct) return
    setLoadingProduct(true)
    setScanError(null)
    setView(VIEW.HOME) 

    try {
      const p = await fetchProduct(barcode)
      if (p) {
        setProduct(p)
        setView(VIEW.PRODUCT)
      } else {
        setScanError(`Producto con código ${barcode} no encontrado en la base de datos.`)
      }
    } catch {
      setScanError('Error al buscar el producto. Revisa tu conexión.')
    } finally {
      setLoadingProduct(false)
    }
  }, [loadingProduct])

  // List mutation
  const handleItemSaved = useCallback((item) => {
    setItems(prev => [item, ...prev])
    setView(VIEW.HOME)
    setProduct(null)
  }, [])

  const handleItemDelete = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const clearList = () => {
    if (window.confirm('¿Vaciar toda la lista?')) setItems([])
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col safe-top">
      {/* ── Header / Budget Counter ── */}
      <header className="sticky top-0 z-20 bg-surface-900/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight" onClick={handleLogout}>
                <span className="text-brand-400">🛍</span>
                <span className="text-white ml-2">Uppa</span>
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Lista de hoy · {items.length} artículos</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
              Total acumulado
            </p>
            <p
              className="text-2xl font-black tabular-nums"
              style={{
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currencySymbol}{total.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-3 h-1 w-full bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-300 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((total / 1000) * 100, 100)}%` }}
          />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto px-4 pb-28">

        {view === VIEW.SCANNER && (
          <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
            <div className="bg-surface-800 rounded-t-3xl p-5 animate-slide-up safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white">📷 Escanear producto</h2>
                <span className="text-xs text-gray-500 bg-surface-700 px-2 py-1 rounded-full">EAN · UPC</span>
              </div>
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onClose={() => setView(VIEW.HOME)}
              />
            </div>
          </div>
        )}

        {view === VIEW.PRODUCT && product && (
          <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
            <div className="bg-surface-800 rounded-t-3xl p-5 animate-slide-up safe-bottom max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white">Producto escaneado</h2>
              </div>
              <ProductCard
                product={product}
                currencySymbol={currencySymbol}
                onSave={handleItemSaved}
                onDismiss={() => { setView(VIEW.HOME); setProduct(null) }}
              />
            </div>
          </div>
        )}

        {loadingProduct && (
          <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            <div className="glass-card p-6 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-300">Buscando producto…</p>
            </div>
          </div>
        )}

        {scanError && (
          <div className="mt-4 rounded-2xl bg-red-900/30 border border-red-700/40 p-4 flex items-start gap-3 animate-bounce-in">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-300">{scanError}</p>
              <button
                onClick={() => setScanError(null)}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && !loadingProduct ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center text-4xl ring-1 ring-white/5 shadow-xl">
              🛒
            </div>
            <div>
              <p className="font-semibold text-white">Tu lista está vacía</p>
              <p className="text-sm text-gray-500 mt-1">Presiona el botón verde para escanear un producto</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Artículos</p>
              {items.length > 0 && (
                <button
                  onClick={clearList}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  Vaciar
                </button>
              )}
            </div>

            {items.map(item => (
              <ShoppingListItem
                key={item.id}
                item={item}
                currencySymbol={currencySymbol}
                onDelete={handleItemDelete}
              />
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 safe-bottom">
        <button
          onClick={() => { setScanError(null); setView(VIEW.SCANNER) }}
          disabled={loadingProduct}
          className="flex items-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-white text-base shadow-2xl shadow-brand-900/60 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            boxShadow: '0 0 32px #22c55e44, 0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <span className="text-xl">📷</span>
          <span>Escanear producto</span>
        </button>
      </div>
    </div>
  )
}
