// Seed data DEMO untuk ZGold (POS emas/perhiasan) — mengisi toko (tenant) milik
// akun demo dengan stok produk perhiasan dan transaksi jual/buyback tersebar
// ~2 bulan. Master logam & kadar (emas/perak/dll) dipakai apa adanya (global).
//
// Pakai `pg` + DATABASE_URL (sama seperti lib/db.ts). IDEMPOTENT / RESET MANUAL:
// tiap dijalankan, produk & transaksi demo toko ini DIHAPUS lalu diisi ulang
// (baris tenants/users/logam/kadar TIDAK dihapus). Reset:
//   node scripts/seed-demo.js
// Target toko: env DEMO_EMAIL (owner_email), fallback toko pertama.

const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
})
const q = (sql, params = []) => pool.query(sql, params).then((r) => r.rows)

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@zomet.my.id'
const now = new Date()
const base = Date.now()
const rint = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
function daysAgo(n) { const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(rint(9, 17), rint(0, 59), 0, 0); return d }

const JENIS = ['Cincin', 'Kalung', 'Gelang', 'Anting', 'Liontin', 'Cincin Kawin']
const NAMA_PIHAK = ['Ibu Sari', 'Bpk Andi', 'Ibu Dewi', 'Bpk Hendra', 'Ibu Ratna', 'Bpk Budi', 'Ibu Maya', 'Bpk Eko', 'Ibu Citra', 'Bpk Rizky']

// Warna aksen per logam (samakan dengan lib/logam.ts)
const LOGAM_COLOR = { emas: '#B8860B', perak: '#708090', platinum: '#5B6675', emasputih: '#A9A9A9', palladium: '#7B68EE' }

// Foto dummy self-contained (SVG data-URL) — tanpa host/internet, aman utk PWA.
function fotoDummy(logamId, metalNama, kadarLabel, jenis) {
  const c = LOGAM_COLOR[logamId] || '#B8860B'
  const metal = String(metalNama || '').replace(/\s*\(.*\)/, '').trim()
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='#141210'/><stop offset='1' stop-color='${c}'/>` +
    `</linearGradient></defs>` +
    `<rect width='400' height='300' fill='url(#g)'/>` +
    `<text x='200' y='150' font-family='Georgia, serif' font-size='110' fill='#ffffff' fill-opacity='0.92' text-anchor='middle' dominant-baseline='central'>◆</text>` +
    `<text x='200' y='215' font-family='Arial, sans-serif' font-size='26' font-weight='bold' fill='#ffffff' fill-opacity='0.95' text-anchor='middle'>${jenis}</text>` +
    `<text x='200' y='245' font-family='Arial, sans-serif' font-size='17' fill='#ffffff' fill-opacity='0.8' text-anchor='middle'>${metal} ${kadarLabel}</text>` +
    `</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

async function main() {
  // 1. Toko target
  let rows = await q(`SELECT id, nama_toko FROM tenants WHERE lower(owner_email) = lower($1) LIMIT 1`, [DEMO_EMAIL])
  if (rows.length === 0) rows = await q(`SELECT id, nama_toko FROM tenants WHERE slug = 'demo' LIMIT 1`)
  if (rows.length === 0) rows = await q(`SELECT id, nama_toko FROM tenants ORDER BY id LIMIT 1`)
  if (rows.length === 0) throw new Error('Tidak ada tenant di ZGold. Daftar toko dulu.')
  const tenantId = rows[0].id
  console.log(`Target toko: ${rows[0].nama_toko} [id=${tenantId}]`)

  // 2. Master logam + kadar (global)
  const logam = await q(`SELECT id, nama, spot_price, buyback_ratio, ongkos_default FROM logam`)
  const kadar = await q(`SELECT id, logam_id, label, nilai FROM kadar ORDER BY urutan`)
  if (logam.length === 0 || kadar.length === 0) throw new Error('Master logam/kadar kosong. Jalankan migration 001 dulu.')
  const kadarByLogam = {}
  for (const k of kadar) (kadarByLogam[k.logam_id] ||= []).push(k)
  const logamPunyaKadar = logam.filter((l) => (kadarByLogam[l.id] || []).length)

  // 3. RESET produk & transaksi toko ini
  await q(`DELETE FROM transaksi WHERE tenant_id = $1`, [tenantId])
  try { await q(`DELETE FROM log_stok WHERE tenant_id = $1`, [tenantId]) } catch {}
  await q(`DELETE FROM produk WHERE tenant_id = $1`, [tenantId])
  console.log('Data demo lama dibersihkan.')

  // 4. Produk perhiasan (15)
  let produkCount = 0
  for (let i = 0; i < 15; i++) {
    const l = pick(logamPunyaKadar.length ? logamPunyaKadar : logam)
    const k = pick(kadarByLogam[l.id] || kadar)
    const jenis = pick(JENIS)
    const berat = (Math.random() * 9 + 1).toFixed(2) // 1–10 gram
    const ongkos = Number(l.ongkos_default) || rint(20, 80) * 1000
    const nama = `${jenis} ${l.nama} ${k.label}`
    // ~1 dari 5 produk sengaja tanpa foto untuk mendemokan placeholder fallback
    const foto = i % 5 === 4 ? null : fotoDummy(l.id, l.nama, k.label, jenis)
    await q(
      `INSERT INTO produk (kode, logam_id, kadar_id, jenis, nama, berat_gram, ongkos_cetak, stok, tenant_id, foto_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [`PRD-${tenantId}-${base}-${i}`, l.id, k.id, jenis, nama, berat, ongkos, rint(1, 5), tenantId, foto]
    )
    produkCount++
  }

  // 5. Transaksi jual/buyback (~50) tersebar 60 hari
  let trxCount = 0, omzet = 0
  for (let i = 0; i < 50; i++) {
    const l = pick(logamPunyaKadar.length ? logamPunyaKadar : logam)
    const k = pick(kadarByLogam[l.id] || kadar)
    const tipe = Math.random() < 0.72 ? 'jual' : 'buyback'
    const berat = Number((Math.random() * 7 + 0.5).toFixed(2))
    const jumlah = 1
    const spot = Number(l.spot_price)
    const nilai = Number(k.nilai)
    let hargaPerGram, ongkos, total
    if (tipe === 'jual') {
      hargaPerGram = Math.round(spot * nilai)
      ongkos = Number(l.ongkos_default) || 0
      total = Math.round(berat * jumlah * hargaPerGram) + ongkos
    } else {
      hargaPerGram = Math.round(spot * nilai * Number(l.buyback_ratio))
      ongkos = 0
      total = Math.round(berat * jumlah * hargaPerGram)
    }
    const diskon = tipe === 'jual' && Math.random() < 0.15 ? Math.round(total * 0.02 / 1000) * 1000 : 0
    total -= diskon
    const bayar = Math.ceil(total / 10000) * 10000
    const createdAt = daysAgo(rint(0, 60))
    await q(
      `INSERT INTO transaksi (no_transaksi, tipe, logam_id, kadar_label, jenis_produk, nama_pihak, berat_gram, jumlah,
        harga_per_gram, ongkos_cetak, kondisi, diskon, total, bayar, kembalian, tenant_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [`TRX-${tenantId}-${base}-${i}`, tipe, l.id, k.label, pick(JENIS), pick(NAMA_PIHAK), berat, jumlah,
        hargaPerGram, ongkos, tipe === 'buyback' ? 0.95 : 1.0, diskon, total, bayar, bayar - total, tenantId, createdAt]
    )
    trxCount++
    if (tipe === 'jual') omzet += total
  }

  console.log('✅ Seed demo ZGold selesai:')
  console.log(`   produk=${produkCount}, transaksi=${trxCount} (omzet jual Rp${omzet.toLocaleString('id-ID')})`)
}

main()
  .then(() => pool.end())
  .catch((e) => { console.error('❌', e.message); pool.end(); process.exit(1) })
