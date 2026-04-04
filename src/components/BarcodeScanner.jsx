import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const SCANNER_ID = 'qr-reader'

/**
 * BarcodeScanner
 * Renders a camera viewfinder and fires onScan(barcode) when a barcode is decoded.
 * @param {{ onScan: (barcode: string) => void, onClose: () => void }} props
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError]     = useState(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    let html5QrCode = new Html5Qrcode(SCANNER_ID)
    let isUnmounted = false
    scannerRef.current = html5QrCode

    const config = {
      fps: 10,
      qrbox: { width: 260, height: 120 },
      aspectRatio: 1.0,
      formatsToSupport: [0, 4, 5, 6, 7, 8, 11, 12, 14], // EAN/UPC/QR
    }

    // Wrap start in a function to cleanly await it
    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isUnmounted) onScan(decodedText)
          },
          () => { /* ignore */ }
        )
        if (isUnmounted) {
          // If unmounted *while* it was starting, stop it immediately
          html5QrCode.stop().then(() => html5QrCode.clear()).catch(()=>{})
        } else {
          setStarted(true)
        }
      } catch (err) {
        if (!isUnmounted) {
          console.error('[BarcodeScanner] start error:', err)
          setError('No se pudo acceder a la cámara. Revisa los permisos o asegúrate de usar HTTPS.')
        }
      }
    }

    startScanner()

    return () => {
      isUnmounted = true
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(()=>{})
      }
    }
  }, [onScan])

  return (
    <div className="flex flex-col gap-3">
      {/* viewfinder container */}
      <div
        id={SCANNER_ID}
        className="w-full rounded-2xl overflow-hidden bg-black"
        style={{ minHeight: 240 }}
      />

      {!started && !error && (
        <p className="text-center text-sm text-gray-400 animate-pulse">
          Iniciando cámara…
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-900/40 border border-red-700/50 p-3 text-sm text-red-300 text-center">
          {error}
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-surface-700 text-gray-300 text-sm font-medium
                   hover:bg-surface-600 active:scale-[0.98] transition-all"
      >
        Cancelar
      </button>
    </div>
  )
}
