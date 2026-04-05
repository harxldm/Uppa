import React, { useState, useEffect } from 'react'
import { updateUserPreferences, signOut } from '../services/auth'
import { supabase } from '../lib/supabaseClient'

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export default function Sidebar({ isOpen, onClose, preferences, onPrefsUpdate }) {
  const [language, setLanguage] = useState(preferences?.language || 'es')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState(null)
  const [userEmail, setUserEmail] = useState('')

  // Sync local state when preferences prop changes
  useEffect(() => {
    if (preferences) {
      setLanguage(preferences.language || 'es')
    }
  }, [preferences])

  // Grab user email
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await updateUserPreferences({
        language,
        setup_completed: true,
      })
      onPrefsUpdate(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar sesión?')) {
      signOut()
    }
  }

  const hasChanges =
    language !== (preferences?.language || 'es')

  return (
    <>
      {/* ── Overlay ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* ── Drawer ── */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: '85%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #141a1f 0%, #0e1318 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '8px 0 40px rgba(0,0,0,0.6)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
        }}
      >
        {/* ── User header ── */}
        <div
          style={{
            padding: '48px 24px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.06) 100%)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#9ca3af',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>

          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              marginBottom: 12,
              boxShadow: '0 0 20px rgba(34,197,94,0.3)',
            }}
          >
            🛍
          </div>

          <p style={{ color: '#ffffff', fontWeight: 700, fontSize: 17, margin: 0 }}>Mi cuenta</p>
          <p
            style={{
              color: '#6b7280',
              fontSize: 13,
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userEmail || '—'}
          </p>
        </div>

        {/* ── Settings body ── */}
        <div style={{ flex: 1, padding: '24px' }}>

          {/* Section: Configuraciones */}
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#4b5563',
              marginBottom: 16,
            }}
          >
            Configuraciones
          </p>

          {/* Language */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#d1d5db',
                marginBottom: 12,
              }}
            >
              <span>🌐</span> Idioma
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `1px solid ${language === lang.code ? '#22c55e' : 'rgba(255,255,255,0.07)'}`,
                    background: language === lang.code
                      ? 'rgba(34,197,94,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    color: language === lang.code ? '#4ade80' : '#9ca3af',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && (
                    <span style={{ marginLeft: 'auto', fontSize: 14 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
              ⚠️ {error}
            </p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || (!hasChanges && !saved)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: saved
                ? 'linear-gradient(135deg, #166534, #16a34a)'
                : hasChanges
                ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                : 'rgba(255,255,255,0.06)',
              color: saved || hasChanges ? '#ffffff' : '#4b5563',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving || (!hasChanges && !saved) ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: hasChanges && !saved ? '0 0 20px rgba(34,197,94,0.25)' : 'none',
              marginBottom: 8,
            }}
          >
            {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : hasChanges ? '💾 Guardar cambios' : 'Sin cambios'}
          </button>

          {/* Divider */}
          <div
            style={{
              margin: '28px 0 24px',
              height: 1,
              background: 'rgba(255,255,255,0.06)',
            }}
          />

          {/* Section: Cuenta */}
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#4b5563',
              marginBottom: 16,
            }}
          >
            Cuenta
          </p>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: '1px solid rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.07)',
              color: '#f87171',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
            }}
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>

        {/* ── Footer version ── */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ color: '#374151', fontSize: 11, textAlign: 'center' }}>Uppa v1.0 · Budget Tracker</p>
        </div>
      </aside>
    </>
  )
}
