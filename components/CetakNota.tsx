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

export default function CetakNota({ data, onClose }: CetakNotaProps) {
  const [printed, setPrinted] = useState(false);

  const receiptLines = [
    "══════════════════════════",
    `    ${data.nama_toko}`,
    data.alamat_toko ? `    ${data.alamat_toko}` : null,
    data.telepon ? `    Telp: ${data.telepon}` : null,
    "══════════════════════════",
    "",
    `No: ${data.no_transaksi}`,
    `Tanggal: ${data.tanggal}`,
    `Kasir: ${data.nama_kasir}`,
    "",
    "──────────────────────────",
    ...data.items.flatMap((item) => [
      `${item.nama} x${item.jumlah}`,
      `  ${formatIDR(item.harga)}`,
    ]),
    "──────────────────────────",
    "",
    `Subtotal:  ${formatIDR(data.subtotal)}`,
    `Diskon:    ${formatIDR(data.diskon)}`,
    `TOTAL:     ${formatIDR(data.total)}`,
    "",
    `Bayar:     ${formatIDR(data.bayar)}`,
    `Kembalian: ${formatIDR(data.kembalian)}`,
    "",
    "──────────────────────────",
    "Terima kasih atas kunjungan",
    "Barang yang sudah dibeli",
    "tidak dapat dikembalikan",
    "══════════════════════════",
  ].filter((line) => line !== null) as string[];

  const handlePrint = useCallback(() => {
    window.print();
    setPrinted(true);
    setTimeout(() => onClose(), 500);
  }, [onClose]);

  const handleShare = useCallback(async () => {
    const text = receiptLines.join("\n");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Nota Transaksi", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert("Teks nota berhasil disalin ke clipboard!");
    }
  }, [receiptLines]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border t-border-md t-bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b t-border px-4 py-3">
          <h2 className="text-sm font-medium">Cetak Nota</h2>
          <button onClick={onClose} className="rounded p-1 t-text-3 t-bg-hover">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        {/* Receipt preview */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <pre
            className="whitespace-pre rounded-lg bg-white p-4 text-[10px] leading-relaxed text-black sm:text-xs"
            id="receipt-content"
            style={{ fontFamily: "monospace" }}
          >
            {receiptLines.join("\n")}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t t-border p-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border t-border-md py-2.5 text-xs t-text-3 t-bg-hover"
          >
            Tutup
          </button>
          <button
            onClick={handleShare}
            className="flex-1 rounded-lg border t-border-md py-2.5 text-xs t-text-3 t-bg-hover"
          >
            <i className="ti ti-share mr-1.5" />
            Bagikan
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 rounded-lg bg-amber-600 py-2.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            <i className="ti ti-printer mr-1.5" />
            Cetak
          </button>
        </div>
      </div>

      {/* Print-only receipt */}
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
            width: 72mm !important;
            max-width: 72mm !important;
            background: white !important;
            color: black !important;
            padding: 4mm !important;
            font-size: 11pt !important;
            font-family: monospace !important;
            z-index: 99999 !important;
          }
          #receipt-content * {
            visibility: visible !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
