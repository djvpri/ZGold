"use client";
import { useState, useEffect, useCallback } from "react";

export interface NotaData {
  no_transaksi: string;
  tanggal: string;
  nama_kasir: string;
  nama_toko: string;
  alamat_toko?: string;
  telepon?: string;
  items: {
    nama: string;
    jumlah: number;
    harga: number;
  }[];
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
}

interface CetakNotaProps {
  data: NotaData;
  onClose: () => void;
}

function formatIDR(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

/** Pad/trim to exact width */
function pad(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return s + " ".repeat(w - s.length);
}
function rpad(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return " ".repeat(w - s.length) + s;
}

export default function CetakNota({ data, onClose }: CetakNotaProps) {
  const [printed, setPrinted] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
    setPrinted(true);
    setTimeout(() => onClose(), 500);
  }, [onClose]);

  const handleShare = useCallback(async () => {
    const text = receiptLines.join("\n");
    if (navigator.share) {
      try { await navigator.share({ title: "Nota Transaksi", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert("Teks nota berhasil disalin ke clipboard!");
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 80 chars per line for PLQ-35 dot matrix
  const W = 80;
  const sep = "═".repeat(W);
  const line = "─".repeat(W);

  const receiptLines: string[] = [
    sep,
    pad(`  ${data.nama_toko}`, W),
    data.alamat_toko ? pad(`  ${data.alamat_toko}`, W) : null,
    data.telepon ? pad(`  Telp: ${data.telepon}`, W) : null,
    "",
    sep,
    "",
    pad(`  No. Transaksi : ${data.no_transaksi}`, W),
    pad(`  Tanggal       : ${data.tanggal}`, W),
    pad(`  Kasir         : ${data.nama_kasir}`, W),
    "",
    line,
    pad(`  Item`, 50) + rpad(`Qty`, 5) + rpad(`Harga`, 25),
    line,
    ...data.items.flatMap((item) => [
      pad(`  ${item.nama}`, 50) + rpad(String(item.jumlah), 5) + rpad(formatIDR(item.harga), 25),
    ]),
    line,
    "",
    pad(`  Subtotal`, 55) + rpad(formatIDR(data.subtotal), 25),
    pad(`  Diskon`, 55) + rpad(formatIDR(data.diskon), 25),
    pad(`  TOTAL`, 55) + rpad(formatIDR(data.total), 25),
    "",
    pad(`  Bayar`, 55) + rpad(formatIDR(data.bayar), 25),
    pad(`  Kembalian`, 55) + rpad(formatIDR(data.kembalian), 25),
    "",
    line,
    "",
    "  Terima kasih atas kunjungan Anda.",
    "  Barang yang sudah dibeli tidak dapat dikembalikan.",
    "",
    sep,
  ].filter((line) => line !== null) as string[];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border t-border-md t-bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b t-border px-4 py-3">
          <h2 className="text-sm font-medium">Cetak Nota</h2>
          <button onClick={onClose} className="rounded p-1 t-text-3 t-bg-hover">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          <pre
            className="whitespace-pre rounded-lg bg-white p-3 text-[8px] leading-[1.2] text-black sm:text-[9px]"
            id="receipt-content"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {receiptLines.join("\n")}
          </pre>
        </div>

        <div className="flex gap-2 border-t t-border p-3">
          <button onClick={onClose} className="flex-1 rounded-lg border t-border-md py-2.5 text-xs t-text-3 t-bg-hover">
            Tutup
          </button>
          <button onClick={handleShare} className="flex-1 rounded-lg border t-border-md py-2.5 text-xs t-text-3 t-bg-hover">
            <i className="ti ti-share mr-1.5" />Bagikan
          </button>
          <button onClick={handlePrint} className="flex-1 rounded-lg bg-amber-600 py-2.5 text-xs font-medium text-white hover:bg-amber-700">
            <i className="ti ti-printer mr-1.5" />Cetak
          </button>
        </div>
      </div>

      {/* Print CSS — PLQ-35 landscape 21cm x 11.5cm */}
      <style jsx global>{`
        @media print {
          html, body {
            visibility: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #receipt-content {
            visibility: visible !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            padding: 3mm 5mm !important;
            font-size: 9pt !important;
            font-family: 'Courier New', Courier, monospace !important;
            line-height: 1.0 !important;
            z-index: 99999 !important;
            white-space: pre !important;
            overflow: visible !important;
          }
          #receipt-content * {
            visibility: visible !important;
            color: black !important;
          }
          @page {
            size: 210mm 115mm landscape !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
