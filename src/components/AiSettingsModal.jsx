import React, { useState } from 'react'

const AI_LEVELS = [
  {
    id: 1,
    label: 'Directo',
    emoji: '⚡',
    description: 'Resumen ultra-rápido. Ideal cuando vas de prisa.',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.10)',
    borderColor: 'rgba(34,197,94,0.30)',
  },
  {
    id: 2,
    label: 'Equilibrado',
    emoji: '⚖️',
    description: 'Lo justo y necesario. Puntos clave de nutrición.',
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,0.10)',
    borderColor: 'rgba(167,139,250,0.30)',
  },
  {
    id: 3,
    label: 'Detallado',
    emoji: '🔬',
    description: 'Análisis experto con todos los detalles.',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.30)',
  },
]

/**
 * AiSettingsModal
 * Two-step flow:
 *   Step 1 → Welcome / Introduction
 *   Step 2 → Choose AI detail level
 */
export default function AiSettingsModal({ currentLevel, onSave, onClose }) {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState(currentLevel || 2)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(selected)
    } catch (err) {
      console.error('[AiSettingsModal] Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.80)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 20,
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(165deg, #181e25 0%, #0f1318 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(167,139,250,0.08)',
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {step === 1 ? (
          /* ── STEP 1: INTRODUCTION ── */
          <div style={{ padding: '40px 28px 32px', textAlign: 'center' }}>
            {/* Glowing icon */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))',
                border: '1px solid rgba(167,139,250,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                margin: '0 auto 24px',
                boxShadow: '0 0 40px rgba(139,92,246,0.15), inset 0 0 20px rgba(139,92,246,0.05)',
              }}
            >
              ✨
            </div>

            {/* Branding */}
            <h2
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              Uppa
              <span style={{
                background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                .ia
              </span>
            </h2>

            <p
              style={{
                fontSize: 12,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 700,
                marginBottom: 28,
              }}
            >
              Tu asesor nutricional inteligente
            </p>

            {/* Description */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 18,
                padding: '20px 22px',
                textAlign: 'left',
                marginBottom: 32,
              }}
            >
              <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: '#ffffff' }}>Uppa.ia</strong> analiza los productos que escaneas
                y te ofrece un veredicto nutricional personalizado, alternativas más saludables y consejos prácticos.
              </p>
              <div style={{ margin: '16px 0', height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🔍</span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Analiza ingredientes y valores nutricionales</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Sugiere alternativas más saludables</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Consejos rápidos para tu salud</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(139,92,246,0.25), 0 4px 20px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
                letterSpacing: '-0.01em',
              }}
            >
              Iniciar
            </button>
          </div>
        ) : (
          /* ── STEP 2: LEVEL SELECTION ── */
          <div style={{ padding: '36px 28px 32px' }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: 6,
                letterSpacing: '-0.02em',
              }}
            >
              Nivel de detalle
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 1.5 }}>
              ¿Qué tanta información quieres recibir de la IA cuando analice un producto?
            </p>

            {/* Level cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {AI_LEVELS.map(level => {
                const isSelected = selected === level.id
                return (
                  <button
                    key={level.id}
                    onClick={() => setSelected(level.id)}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 16,
                      border: `1.5px solid ${isSelected ? level.borderColor : 'rgba(255,255,255,0.06)'}`,
                      background: isSelected ? level.bgColor : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Emoji icon */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: isSelected ? `${level.bgColor}` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? level.borderColor : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {level.emoji}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isSelected ? level.color : '#d1d5db',
                          marginBottom: 2,
                          transition: 'color 0.25s ease',
                        }}
                      >
                        {level.label}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {level.description}
                      </p>
                    </div>

                    {/* Selection indicator */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? level.color : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: level.color,
                          }}
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: '0 0 auto',
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ← Atrás
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  boxShadow: '0 0 24px rgba(139,92,246,0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                {saving ? '⏳ Guardando...' : '✓ Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
