'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onResult: (kode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let scanner: any = null

    async function startScan() {
      try {
        // Dynamic import agar tidak crash di SSR
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('zgold-qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' }, // kamera belakang
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            // Berhasil scan
            scanner.stop().catch(() => {})
            onResult(decodedText.trim())
          },
          () => {} // scan error (abaikan, terus scan)
        )
        setScanning(true)
      } catch (e: any) {
        setError(e.message || 'Tidak bisa akses kamera')
      }
    }

    startScan()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-gray-900 p-4 sm:rounded-2xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Scan Barcode</h3>
            <p className="text-[11px] text-gray-400">Arahkan kamera ke barcode produk</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-gray-700 p-2 text-gray-300 hover:bg-gray-600">
            <i className="ti ti-x text-sm" />
          </button>
        </div>

        {/* Viewfinder */}
        {error ? (
          <div className="mb-3 rounded-xl bg-red-900/50 p-4 text-center">
            <i className="ti ti-camera-off mb-2 block text-3xl text-red-400" />
            <p className="text-xs text-red-300">{error}</p>
            <p className="mt-1 text-[10px] text-gray-500">Pastikan izin kamera sudah diberikan</p>
          </div>
        ) : (
          <div className="relative mb-3 overflow-hidden rounded-xl bg-black">
            <div id="zgold-qr-reader" ref={divRef} className="w-full" />
            {/* Overlay crosshair */}
            {scanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-36 w-60">
                  {/* Sudut */}
                  <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-amber-400 rounded-tl" />
                  <div className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-amber-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-amber-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-amber-400 rounded-br" />
                  {/* Garis scan animasi */}
                  <div className="absolute left-1 right-1 h-0.5 bg-amber-400/70 animate-scan" style={{
                    animation: 'scan 2s linear infinite',
                    top: '50%',
                    boxShadow: '0 0 8px rgba(251,191,36,0.8)'
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input manual fallback */}
        <div className="flex items-center gap-2">
          <input
            placeholder="Atau ketik kode manual..."
            className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none border border-gray-700"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                onResult((e.target as HTMLInputElement).value.trim())
              }
            }}
            autoComplete="off"
          />
          <button onClick={onClose} className="rounded-lg bg-gray-700 px-3 py-2 text-xs text-gray-300">
            Batal
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        #zgold-qr-reader video { width: 100% !important; border-radius: 0 !important; }
        #zgold-qr-reader img { display: none !important; }
        #zgold-qr-reader > div:last-child { display: none !important; }
      `}</style>
    </div>
  )
}
