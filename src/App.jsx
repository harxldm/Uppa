import React, { useState, useCallback, useEffect } from 'react'
import BarcodeScanner from './components/BarcodeScanner'
import ProductCard    from './components/ProductCard'
import ShoppingListItem from './components/ShoppingListItem'
import LoginScreen    from './components/LoginScreen'
import OnboardingScreen from './components/OnboardingScreen'
import Sidebar        from './components/Sidebar'
import HistoryScreen    from './components/HistoryScreen'
import SessionDetail    from './components/SessionDetail'
import AiAnalysisModal  from './components/AiAnalysisModal'
import AiSettingsModal  from './components/AiSettingsModal'
import { fetchProduct } from './services/openFoodFacts'
import { 
  fetchSessions, 
  getActiveSession, 
  createSession, 
  completeSession, 
  deleteSession,
  fetchSessionItems,
  addShoppingItem,
  deleteShoppingItem
} from './services/shoppingList'
import { fetchUserPreferences, updateUserPreferences, signOut } from './services/auth'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'

// ── View states (Main App) ─────────────────────────────────────────────────────────
const VIEW = {
  HISTORY:         'HISTORY',
  ACTIVE_SESSION:  'ACTIVE_SESSION',
  SESSION_DETAIL:  'SESSION_DETAIL',
  SCANNER:         'SCANNER',
  PRODUCT:         'PRODUCT',
  MANUAL:          'MANUAL',
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
    setLoadingAuth(true)
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
  return <MainApp preferences={preferences} onPrefsUpdate={setPreferences} />
}

// ── Sub-component for the Core Logic ───────────────────────────────────────
function MainApp({ preferences = { currency: 'COP' }, onPrefsUpdate }) {
  const [view, setView]             = useState(VIEW.HISTORY)
  const [sessions, setSessions]     = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionItems, setSessionItems]       = useState([])

  const [product, setProduct]       = useState(null)
  const [analyzingProduct, setAnalyzingProduct] = useState(null)
  const [items, setItems]           = useState([])
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [scanError, setScanError]   = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false)

  const currencySymbol = preferences.currency === 'EUR' ? '€' : '$'

  // Load history and check for active session on mount
  useEffect(() => {
    initApp()
  }, [])

  const initApp = async () => {
    setLoadingSessions(true)
    try {
      const active = await getActiveSession()
      if (active) {
        setActiveSession(active)
        const activeItems = await fetchSessionItems(active.id)
        setItems(activeItems)
        setView(VIEW.ACTIVE_SESSION)
      } else {
        const list = await fetchSessions()
        setSessions(list)
        setView(VIEW.HISTORY)
      }
    } catch (err) {
      console.error('Error initializing app data:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadHistory = async () => {
    try {
      const list = await fetchSessions()
      setSessions(list)
    } catch (err) {
      console.error('Error loading history:', err)
    }
  }

  const total = items.reduce(
    (acc, item) => acc + parseFloat(item.price) * (item.quantity || 1),
    0
  )

  const handleBarcodeScan = useCallback(async (barcode) => {
    if (loadingProduct) return
    setLoadingProduct(true)
    setScanError(null)

    try {
      const p = await fetchProduct(barcode)
      if (p) {
        setProduct(p)
        setView(VIEW.PRODUCT)
      } else {
        setProduct({ barcode, name: '', brand: '', imageUrl: null, nutriScore: null, isManual: true })
        setView(VIEW.MANUAL)
      }
    } catch {
      setScanError('Error al buscar el producto. Revisa tu conexión.')
    } finally {
      setLoadingProduct(false)
    }
  }, [loadingProduct])

  const handleStartNew = async () => {
    setLoadingSessions(true)
    try {
      const newSession = await createSession()
      setActiveSession(newSession)
      setItems([])
      setView(VIEW.ACTIVE_SESSION)
    } catch (err) {
      alert('Error al crear sesión: ' + err.message)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleFinishSession = async () => {
    if (!activeSession) return
    if (items.length === 0) {
      if (!window.confirm('La lista está vacía. ¿Deseas descartar este viaje?')) return
      await deleteSession(activeSession.id)
      setActiveSession(null)
      initApp()
      return
    }

    if (!window.confirm('¿Finalizar tu compra y guardar en el historial?')) return

    setLoadingSessions(true)
    try {
      await completeSession(activeSession.id, total)
      setActiveSession(null)
      await initApp()
    } catch (err) {
      alert('Error al finalizar: ' + err.message)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleOpenDetail = async (sess) => {
    setLoadingSessions(true)
    try {
      const detailItems = await fetchSessionItems(sess.id)
      setSelectedSession(sess)
      setSessionItems(detailItems)
      setView(VIEW.SESSION_DETAIL)
    } catch (err) {
      alert('Error al cargar detalle: ' + err.message)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleDeleteSessionFromHistory = async (id) => {
    try {
      await deleteSession(id)
      loadHistory()
    } catch (err) {
      alert('Error al borrar: ' + err.message)
    }
  }

  const handleItemSaved = useCallback(async (itemData) => {
    if (!activeSession) return
    try {
      const savedItem = await addShoppingItem(itemData, activeSession.id)
      setItems(prev => [savedItem, ...prev])
      setView(VIEW.ACTIVE_SESSION)
      setProduct(null)
    } catch (err) {
      alert('Error al guardar artículo: ' + err.message)
    }
  }, [activeSession])

  const handleItemDelete = useCallback(async (id) => {
    try {
      await deleteShoppingItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col safe-top">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        preferences={preferences}
        onPrefsUpdate={onPrefsUpdate}
        onOpenAiSettings={() => setAiSettingsOpen(true)}
      />

      {view === VIEW.ACTIVE_SESSION && (
        <header className="sticky top-0 z-20 bg-surface-900/95 backdrop-blur-md border-b border-white/5 px-4 py-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-gray-400"
              >
                ☰
              </button>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">
                  <span className="text-brand-400">🛍</span>
                  <span className="text-white ml-2">Uppa</span>
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Lista activa · {items.length} artículos</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Subtotal</p>
              <p className="text-2xl font-black tabular-nums text-brand-400">
                {currencySymbol}{total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((total / 1000) * 100, 100)}%` }}
              />
            </div>
            <button 
              onClick={handleFinishSession}
              className="px-3 py-1 bg-brand-500 text-white text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-all"
            >
              Terminar
            </button>
          </div>
        </header>
      )}

      {view === VIEW.HISTORY && (
        <header className="px-4 py-6 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <button
               onClick={() => setSidebarOpen(true)}
               className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-gray-400"
            >☰</button>
            <h1 className="text-2xl font-black text-white">Uppa</h1>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {view === VIEW.HISTORY && (
          <HistoryScreen 
            sessions={sessions}
            onStartNew={handleStartNew}
            onOpenSession={handleOpenDetail}
            onDeleteSession={handleDeleteSessionFromHistory}
            loading={loadingSessions}
          />
        )}

        {view === VIEW.SESSION_DETAIL && (
          <SessionDetail 
            session={selectedSession}
            items={sessionItems}
            currencySymbol={currencySymbol}
            onBack={() => setView(VIEW.HISTORY)}
            onAnalysis={(i) => setAnalyzingProduct(i)}
          />
        )}

        {view === VIEW.ACTIVE_SESSION && (
          <div className="px-4 pb-28">
            {items.length === 0 ? (
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
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Artículos</p>
                {items.map(item => (
                  <ShoppingListItem
                    key={item.id}
                    item={item}
                    currencySymbol={currencySymbol}
                    onDelete={handleItemDelete}
                    onClick={(i) => setAnalyzingProduct(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- Shared Modals --- */}

        {analyzingProduct && (
          <AiAnalysisModal 
            product={analyzingProduct} 
            onClose={() => setAnalyzingProduct(null)}
            aiDetailLevel={preferences?.ai_detail_level || 2}
          />
        )}

        {aiSettingsOpen && (
          <AiSettingsModal
            currentLevel={preferences?.ai_detail_level || 2}
            onSave={async (level) => {
              try {
                const updated = await updateUserPreferences({ ai_detail_level: level })
                onPrefsUpdate(updated)
              } catch (err) {
                console.error('Error saving AI level:', err)
              }
              setAiSettingsOpen(false)
            }}
            onClose={() => setAiSettingsOpen(false)}
          />
        )}

        {view === VIEW.SCANNER && (
          <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
            <div className="bg-surface-800 rounded-t-3xl p-5 animate-slide-up safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white">📷 Escanear producto</h2>
                <span className="text-xs text-gray-500 bg-surface-700 px-2 py-1 rounded-full">EAN · UPC</span>
              </div>
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onClose={() => setView(VIEW.ACTIVE_SESSION)}
              />
            </div>
          </div>
        )}

        {(view === VIEW.PRODUCT || view === VIEW.MANUAL) && product && (
          <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
            <div className="bg-surface-800 rounded-t-3xl p-5 animate-slide-up safe-bottom max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white">
                  {view === VIEW.PRODUCT ? 'Producto escaneado' : '✏️ Ingresar producto'}
                </h2>
              </div>
              {view === VIEW.MANUAL && <p className="text-xs text-gray-500 mb-4">No encontramos este código. Escribe los datos.</p>}
              <ProductCard
                product={product}
                currencySymbol={currencySymbol}
                onSave={handleItemSaved}
                onDismiss={() => { setView(VIEW.ACTIVE_SESSION); setProduct(null) }}
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
          <div className="mt-4 px-4">
            <div className="rounded-2xl bg-red-900/30 border border-red-700/40 p-4 flex items-start gap-3 animate-bounce-in">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-red-300">{scanError}</p>
                <button onClick={() => setScanError(null)} className="mt-2 text-xs text-red-400 hover:text-red-300 underline">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {view === VIEW.ACTIVE_SESSION && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 safe-bottom">
          <button
            onClick={() => { setScanError(null); setView(VIEW.SCANNER) }}
            className="flex items-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-white text-base shadow-2xl shadow-brand-900/60 active:scale-95 transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              boxShadow: '0 0 32px #22c55e44, 0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <span className="text-xl">📷</span>
            <span>Escanear producto</span>
          </button>
        </div>
      )}
    </div>
  )
}
