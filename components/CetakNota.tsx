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
  format?: "thermal" | "plq35";
}

function formatIDR(n: number | string | null | undefined) {
  const num = typeof n === "string" ? parseFloat(n) : Number(n ?? 0);
  if (isNaN(num)) return "Rp 0";
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

function pad(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return s + " ".repeat(w - s.length);
}
function rpad(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return " ".repeat(w - s.length) + s;
}

export default function CetakNota({ data, onClose, format = "thermal" }: CetakNotaProps) {
  const [printed, setPrinted] = useState(false);
  const isWide = format === "plq35";

  // Lebar karakter: 42 utk thermal 58mm, 80 utk PLQ-35 landscape
  const W = isWide ? 80 : 42;
  const sep = "═".repeat(W);
  const line = "─".repeat(W);

  const receiptLines: string[] = [
    sep,
    pad(`${data.nama_toko}`, W),
    data.alamat_toko ? pad(`${data.alamat_toko}`, W) : null,
    data.telepon ? pad(`Telp: ${data.telepon}`, W) : null,
    "",
    sep,
    "",
    pad(`No. Transaksi : ${data.no_transaksi}`, W),
    pad(`Tanggal       : ${data.tanggal}`, W),
    pad(`Kasir         : ${data.nama_kasir}`, W),
    "",
    line,
    pad(`Item`, isWide ? 50 : 22) + rpad(`Qty`, isWide ? 5 : 4) + rpad(`Harga`, isWide ? 25 : 16),
    line,
    ...data.items.flatMap((item) => [
      pad(` ${item.nama}`, isWide ? 50 : 22) + rpad(String(item.jumlah), isWide ? 5 : 4) + rpad(formatIDR(item.harga * item.jumlah), isWide ? 25 : 16),
      item.jumlah > 1 ? pad(`  @ ${formatIDR(item.harga)} x${item.jumlah}`, W) : null,
    ].filter(Boolean) as string[]),
    line,
    "",
    pad(`Subtotal`, isWide ? 55 : 22) + rpad(formatIDR(data.subtotal), isWide ? 25 : 20),
    pad(`Diskon`, isWide ? 55 : 22) + rpad(formatIDR(data.diskon), isWide ? 25 : 20),
    pad(`TOTAL`, isWide ? 55 : 22) + rpad(formatIDR(data.total), isWide ? 25 : 20),
    "",
    pad(`Bayar`, isWide ? 55 : 22) + rpad(formatIDR(data.bayar), isWide ? 25 : 20),
    pad(`Kembalian`, isWide ? 55 : 22) + rpad(formatIDR(data.kembalian), isWide ? 25 : 20),
    "",
    line,
    "",
    "  Terima kasih.",
    "  Barang dibeli tidak dapat dikembalikan.",
    "",
    sep,
  ].filter((l) => l !== null) as string[];

  const handlePrint = useCallback(() => {
    const text = receiptLines.join("\n");
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const pageCss = isWide
      ? `@page { size: 210mm 115mm landscape; margin: 0; } pre { width: 210mm; box-sizing: border-box; padding: 3mm 5mm; font-size: 9pt; line-height: 1.0; }`
      : `@page { size: 58mm auto; margin: 0; } pre { width: 58mm; box-sizing: border-box; padding: 2mm 3mm; font-size: 7.5pt; line-height: 1.15; }`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Nota ${data.no_transaksi}</title><style>
      html,body{margin:0;padding:0;background:#fff;color:#000;}
      pre{font-family:'Courier New',Courier,monospace;white-space:pre;color:#000;margin:0;}
      ${pageCss}
    </style></head><body><pre>${esc}</pre></body></html>`;

    // Cetak lewat iframe tersembunyi — dokumen struk terisolasi, lebih andal
    // daripada window.print() + @media print (yang sering blank di modal/PWA).
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      document.body.removeChild(iframe);
      // Fallback ke metode lama bila iframe tak tersedia.
      window.print();
      setPrinted(true);
      setTimeout(() => onClose(), 500);
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 300);
      onClose();
    };

    doc.open();
    doc.write(html);
    doc.close();
    win.onafterprint = finish;

    setPrinted(true);
    // Beri jeda agar iframe selesai render sebelum print.
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        window.print();
      }
      // Fallback cleanup bila onafterprint tidak didukung (mis. beberapa mobile).
      setTimeout(finish, 2000);
    }, 200);
  }, [receiptLines, isWide, data.no_transaksi, onClose]);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onClick={onClose}>
      <div
        className={`rounded-xl border t-border-md t-bg-card shadow-2xl ${isWide ? 'w-full max-w-sm' : 'w-[280px]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b t-border px-4 py-3">
          <h2 className="text-sm font-medium">Nota {isWide ? "(PLQ-35)" : "(Thermal)"}</h2>
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
          <button onClick={handlePrint} className="btn-gold flex-1 rounded-lg py-2.5 text-xs font-medium">
            <i className="ti ti-printer mr-1.5" />Cetak
          </button>
        </div>
      </div>

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
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            z-index: 99999 !important;
            white-space: pre !important;
            overflow: visible !important;
            ${isWide ? `
              width: 210mm !important;
              max-width: 210mm !important;
              padding: 3mm 5mm !important;
              font-size: 9pt !important;
              line-height: 1.0 !important;
            ` : `
              width: 58mm !important;
              max-width: 58mm !important;
              padding: 2mm 3mm !important;
              font-size: 7.5pt !important;
              line-height: 1.15 !important;
            `}
          }
          #receipt-content * {
            visibility: visible !important;
            color: black !important;
          }
          @page {
            ${isWide ? `size: 210mm 115mm landscape !important;` : `size: 58mm auto !important;`}
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
