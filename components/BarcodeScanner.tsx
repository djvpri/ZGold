'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onResult: (kode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const scannerRef = useRef<any>(null)
  const startedRef = useRef(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const manualRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true

    async function startScan() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mounted) return

        const scanner = new Html5Qrcode('zgold-qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 },
          (decodedText: string) => {
            if (!mounted) return
            stopAndClose(() => onResult(decodedText.trim()))
          },
          () => {}
        )
        if (mounted) {
          startedRef.current = true
          setScanning(true)
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Tidak bisa akses kamera')
      }
    }

    startScan()

    return () => {
      mounted = false
      cleanup()
    }
  }, [])

  function cleanup() {
    if (scannerRef.current && startedRef.current) {
      scannerRef.current.stop().catch(() => {})
      startedRef.current = false
    }
  }

  function stopAndClose(cb?: () => void) {
    cleanup()
    cb?.()
    onClose()
  }

  function handleManualEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim()
      if (val) stopAndClose(() => onResult(val))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) stopAndClose() }}>
      <div className="w-full max-w-sm rounded-t-2xl bg-gray-900 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Scan Barcode</h3>
            <p className="text-[11px] text-gray-400">Arahkan ke barcode produk</p>
          </div>
          <button onClick={() => stopAndClose()}
            className="rounded-full bg-gray-700 p-2 text-gray-300 hover:bg-gray-600">
            <i className="ti ti-x text-sm" />
          </button>
        </div>

        {/* Viewfinder */}
        {error ? (
          <div className="mb-3 rounded-xl bg-red-900/40 p-5 text-center">
            <i className="ti ti-camera-off mb-2 block text-3xl text-red-400" />
            <p className="text-xs text-red-300 mb-1">{error}</p>
            <p className="text-[10px] text-gray-500">Pastikan izin kamera sudah diberikan di browser</p>
          </div>
        ) : (
          <div className="relative mb-3 overflow-hidden rounded-xl bg-black min-h-[200px]">
            <div id="zgold-qr-reader" className="w-full" />
            {scanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-36 w-60">
                  <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-amber-400 rounded-tl" />
                  <div className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-amber-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-amber-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-amber-400 rounded-br" />
                  <div className="absolute left-1 right-1 h-0.5 bg-amber-400/70 scanline" />
                </div>
              </div>
            )}
            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Input manual */}
        <div className="flex gap-2">
          <input ref={manualRef} placeholder="Atau ketik kode manual + Enter..."
            onKeyDown={handleManualEnter}
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none" />
          <button onClick={() => stopAndClose()}
            className="rounded-lg bg-gray-700 px-4 py-2 text-xs text-gray-300 hover:bg-gray-600">
            Batal
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scanline { 0%,100% { top:8%; } 50% { top:88%; } }
        .scanline { animation: scanline 2s ease-in-out infinite; position:absolute; }
        #zgold-qr-reader video { width:100%!important; border-radius:0!important; display:block; }
        #zgold-qr-reader > div > img { display:none!important; }
        #zgold-qr-reader > div:last-child { display:none!important; }
        #zgold-qr-reader > div:first-child { padding:0!important; border:none!important; }
      `}</style>
    </div>
  )
}
