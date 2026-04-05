import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const SCANNER_ID = 'qr-reader'

/**
 * BarcodeScanner
 * Camera viewfinder with zoom control via the Camera API.
 * Fires onScan(barcode) when a barcode is decoded.
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef   = useRef(null)
  const streamRef    = useRef(null)  // holds the active MediaStream
  const [error, setError]       = useState(null)
  const [started, setStarted]   = useState(false)
  const [zoom, setZoom]         = useState(1)
  const [zoomMin, setZoomMin]   = useState(1)
  const [zoomMax, setZoomMax]   = useState(1)
  const [zoomStep, setZoomStep] = useState(0.1)
  const [supportsZoom, setSupportsZoom] = useState(false)
  const [torch, setTorch]       = useState(false)
  const [supportsTorch, setSupportsTorch] = useState(false)

  // Discover the active video track from the DOM video element
  const getVideoTrack = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getVideoTracks()
      return tracks.length > 0 ? tracks[0] : null
    }
    // Fallback: grab from any video element on the page
    const video = document.querySelector(`#${SCANNER_ID} video`)
    if (video && video.srcObject) {
      streamRef.current = video.srcObject
      const tracks = video.srcObject.getVideoTracks()
      return tracks.length > 0 ? tracks[0] : null
    }
    return null
  }, [])

  // Apply zoom via applyConstraints
  const applyZoom = useCallback(async (newZoom) => {
    const track = getVideoTrack()
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ zoom: newZoom }] })
    } catch (e) {
      console.warn('[BarcodeScanner] zoom error:', e)
    }
  }, [getVideoTrack])

  // Apply torch
  const applyTorch = useCallback(async (on) => {
    const track = getVideoTrack()
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: on }] })
    } catch (e) {
      console.warn('[BarcodeScanner] torch error:', e)
    }
  }, [getVideoTrack])

  // Detect capabilities once camera is started
  const detectCapabilities = useCallback(() => {
    // poll until the video element exists
    const poll = setInterval(() => {
      const video = document.querySelector(`#${SCANNER_ID} video`)
      if (video && video.srcObject) {
        streamRef.current = video.srcObject
        const tracks = video.srcObject.getVideoTracks()
        if (tracks.length > 0) {
          const track = tracks[0]
          const caps  = track.getCapabilities?.() || {}

          if (caps.zoom) {
            setZoomMin(caps.zoom.min ?? 1)
            setZoomMax(caps.zoom.max ?? 1)
            setZoomStep(caps.zoom.step ?? 0.1)
            setZoom(caps.zoom.min ?? 1)
            setSupportsZoom(true)
          }

          if (caps.torch) {
            setSupportsTorch(true)
          }

          // Enable continuous autofocus
          try {
            track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
          } catch (_) {}
        }
        clearInterval(poll)
      }
    }, 300)

    // Stop polling after 6s max
    setTimeout(() => clearInterval(poll), 6000)
  }, [])

  useEffect(() => {
    let html5QrCode = new Html5Qrcode(SCANNER_ID)
    let isUnmounted = false
    scannerRef.current = html5QrCode

    const config = {
      fps: 10,
      qrbox: { width: 260, height: 120 },
      aspectRatio: 1.33,
      formatsToSupport: [0, 4, 5, 6, 7, 8, 11, 12, 14], // EAN/UPC/QR
    }

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isUnmounted) onScan(decodedText)
          },
          () => { /* ignore decode errors */ }
        )

        if (isUnmounted) {
          html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {})
        } else {
          setStarted(true)
          detectCapabilities()
        }
      } catch (err) {
        if (!isUnmounted) {
          console.error('[BarcodeScanner] start error:', err)
          setError('No se pudo acceder a la cámara. Revisa los permisos o usa HTTPS.')
        }
      }
    }

    startScanner()

    return () => {
      isUnmounted = true
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {})
      }
    }
  }, [onScan, detectCapabilities])

  // Handle zoom slider change
  const handleZoomChange = (e) => {
    const val = parseFloat(e.target.value)
    setZoom(val)
    applyZoom(val)
  }

  // Handle torch toggle
  const handleTorch = () => {
    const next = !torch
    setTorch(next)
    applyTorch(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Viewfinder ── */}
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
          minHeight: 240,
        }}
      >
        <div id={SCANNER_ID} style={{ width: '100%' }} />

        {/* Scanner line animation overlay */}
        {started && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '72%',
                height: 2,
                background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                animation: 'scanLine 1.8s ease-in-out infinite',
                borderRadius: 2,
                boxShadow: '0 0 8px #22c55e',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {!started && !error && (
        <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', animation: 'pulse 2s infinite' }}>
          Iniciando cámara…
        </p>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            borderRadius: 12,
            background: 'rgba(127,29,29,0.4)',
            border: '1px solid rgba(185,28,28,0.5)',
            padding: '12px 16px',
            fontSize: 13,
            color: '#fca5a5',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Zoom control ── */}
      {started && supportsZoom && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
              🔍 Zoom
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#4ade80',
                background: 'rgba(34,197,94,0.12)',
                padding: '2px 10px',
                borderRadius: 20,
              }}
            >
              {zoom.toFixed(1)}×
            </span>
          </div>

          <input
            type="range"
            min={zoomMin}
            max={zoomMax}
            step={zoomStep}
            value={zoom}
            onChange={handleZoomChange}
            style={{
              width: '100%',
              accentColor: '#22c55e',
              cursor: 'pointer',
              height: 6,
              borderRadius: 3,
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 11,
              color: '#4b5563',
            }}
          >
            <span>{zoomMin.toFixed(1)}×</span>
            <span>{zoomMax.toFixed(1)}×</span>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 10 }}>
        {/* Torch / Flash (only if device supports it) */}
        {started && supportsTorch && (
          <button
            onClick={handleTorch}
            style={{
              flex: '0 0 auto',
              width: 48,
              height: 48,
              borderRadius: 14,
              border: `1px solid ${torch ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: torch ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
              color: torch ? '#fde68a' : '#6b7280',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            title={torch ? 'Apagar linterna' : 'Encender linterna'}
          >
            🔦
          </button>
        )}

        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '13px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: '#9ca3af',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Cancelar
        </button>
      </div>

      {/* Scan line animation keyframes */}
      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-40px); opacity: 0.4; }
          50%  { transform: translateY(40px);  opacity: 1;   }
          100% { transform: translateY(-40px); opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
