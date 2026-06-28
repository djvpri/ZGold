// lib/logam.ts
// Konfigurasi logam — bisa di-override dari tabel `logam` di Supabase.

export interface KadarOpsi {
  label: string;
  nilai: number;
  isLM?: boolean;
}

export interface LogamConfig {
  id: string;
  nama: string;
  icon: string;
  accent: string;
  bg: string;
  textColor: string;
  spotDefault: number;
  buybackRatio: number;
  ongkosDefault: number;
  kadar: KadarOpsi[];
  jenis: string[];
  lmBerat: number[];
}

export const LOGAM: Record<string, LogamConfig> = {
  emas: {
    id: "emas",
    nama: "Emas (Gold)",
    icon: "ti-diamond",
    accent: "#B8860B",
    bg: "#1a1408",
    textColor: "#FFD700",
    spotDefault: 1_095_000,
    buybackRatio: 0.95,
    ongkosDefault: 50_000,
    kadar: [
      { label: "24K", nilai: 0.999 },
      { label: "22K", nilai: 0.916 },
      { label: "18K", nilai: 0.75 },
      { label: "14K", nilai: 0.585 },
      { label: "LM", nilai: 0.999, isLM: true },
    ],
    jenis: ["Kalung", "Gelang", "Cincin", "Anting", "Bros/Liontin", "Logam Mulia"],
    lmBerat: [0.5, 1, 2, 5, 10, 25, 50, 100],
  },
  perak: {
    id: "perak",
    nama: "Perak (Silver)",
    icon: "ti-coin",
    accent: "#708090",
    bg: "#0f1318",
    textColor: "#C0C0C0",
    spotDefault: 13_500,
    buybackRatio: 0.88,
    ongkosDefault: 15_000,
    kadar: [
      { label: "999", nilai: 0.999 },
      { label: "Sterling 925", nilai: 0.925 },
      { label: "800", nilai: 0.8 },
      { label: "700", nilai: 0.7 },
    ],
    jenis: ["Kalung Perak", "Gelang Perak", "Cincin Perak", "Anting Perak", "Liontin Perak", "LM Perak"],
    lmBerat: [],
  },
  platinum: {
    id: "platinum",
    nama: "Platinum",
    icon: "ti-medal",
    accent: "#5B6675",
    bg: "#0d1117",
    textColor: "#E8EDF2",
    spotDefault: 1_850_000,
    buybackRatio: 0.92,
    ongkosDefault: 75_000,
    kadar: [
      { label: "Pt950", nilai: 0.95 },
      { label: "Pt900", nilai: 0.9 },
      { label: "Pt850", nilai: 0.85 },
    ],
    jenis: ["Cincin Platinum", "Kalung Platinum", "Gelang Platinum", "Anting Platinum"],
    lmBerat: [],
  },
  emasputih: {
    id: "emasputih",
    nama: "Emas Putih",
    icon: "ti-circle",
    accent: "#A9A9A9",
    bg: "#111111",
    textColor: "#E5E5E5",
    spotDefault: 1_095_000,
    buybackRatio: 0.9,
    ongkosDefault: 80_000,
    kadar: [
      { label: "18K", nilai: 0.75 },
      { label: "14K", nilai: 0.585 },
      { label: "10K", nilai: 0.417 },
    ],
    jenis: ["Cincin Emas Putih", "Kalung Emas Putih", "Gelang Emas Putih", "Anting Emas Putih"],
    lmBerat: [],
  },
  palladium: {
    id: "palladium",
    nama: "Palladium",
    icon: "ti-atom",
    accent: "#7B68EE",
    bg: "#0e0b1a",
    textColor: "#C8B8FF",
    spotDefault: 1_250_000,
    buybackRatio: 0.91,
    ongkosDefault: 70_000,
    kadar: [
      { label: "Pd999", nilai: 0.999 },
      { label: "Pd950", nilai: 0.95 },
      { label: "Pd500", nilai: 0.5 },
    ],
    jenis: ["Cincin Palladium", "Gelang Palladium", "Kalung Palladium"],
    lmBerat: [],
  },
};

export const KONDISI_OPSI = [
  { label: "Mulus / Bersertifikat", nilai: 1.0 },
  { label: "Baik", nilai: 0.97 },
  { label: "Rusak Ringan", nilai: 0.93 },
  { label: "Rusak Berat", nilai: 0.88 },
];

// ---------- Helper kalkulasi ----------
export function hitungHargaJual(p: {
  spot: number;
  kadar: number;
  berat: number;
  ongkos: number;
  jumlah: number;
  diskon: number;
}): number {
  const hargaPerGram = Number(p.spot) * Number(p.kadar);
  const subtotal = (hargaPerGram * Number(p.berat) + Number(p.ongkos)) * Number(p.jumlah);
  return Math.max(0, Math.round(subtotal - Number(p.diskon)));
}

export function hitungBuyback(p: {
  spot: number;
  buybackRatio: number;
  kadar: number;
  berat: number;
  kondisi: number;
}): number {
  return Math.round(p.spot * p.buybackRatio * p.kadar * p.berat * p.kondisi);
}

export const formatIDR = (n: number | string | null | undefined) => {
  const num = typeof n === "string" ? parseFloat(n) : Number(n ?? 0);
  if (isNaN(num)) return "Rp 0";
  return "Rp " + Math.round(num).toLocaleString("id-ID");
};
