#!/usr/bin/env node
// =============================================================
// SEED DUMMY DATA — ZGold POS Perhiasan
// Jalankan: DATABASE_URL="postgresql://..." node scripts/seed-dummy.js
// =============================================================

const { Pool } = require("pg");
const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateNoTransaksi(tipe, index) {
  const prefix = tipe === "jual" ? "JL" : "BB";
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${ymd}-${String(index).padStart(4, "0")}`;
}

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ========== 1. TENANTS ==========
    console.log("\n📦 Creating tenants...");

    const tenants = [
      {
        nama_toko: "Toko Emas Enny",
        slug: "tokoeny",
        owner_name: "Enny Hartono",
        owner_email: "enny@tokoeny.com",
        owner_phone: "081345678901",
        alamat: "Jl. Malioboro No. 10, Yogyakarta",
        plan: "pro",
      },
      {
        nama_toko: "Toko Emas Jaya",
        slug: "tokojaya",
        owner_name: "Budi Santoso",
        owner_email: "budi@tokojaya.com",
        owner_phone: "081234567890",
        alamat: "Jl. Sudirman No. 123, Jakarta Selatan",
        plan: "pro",
      },
      {
        nama_toko: "Emas Mulia Surabaya",
        slug: "emasabaya",
        owner_name: "Dewi Lestari",
        owner_email: "dewi@emasabaya.com",
        owner_phone: "085678901234",
        alamat: "Jl. Pemuda No. 456, Surabaya",
        plan: "enterprise",
      },
      {
        nama_toko: "Bengkel Emas Bandung",
        slug: "emasbandung",
        owner_name: "Ahmad Fauzi",
        owner_email: "ahmad@emasbandung.com",
        owner_phone: "087890123456",
        alamat: "Jl. Asia Afrika No. 789, Bandung",
        plan: "basic",
      },
    ];

    const tenantIds = [];
    for (const t of tenants) {
      const res = await client.query(
        `INSERT INTO tenants (nama_toko, slug, owner_name, owner_email, owner_phone, alamat, plan)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET nama_toko = $1, owner_name = $3, owner_phone = $5, alamat = $6
         RETURNING id`,
        [t.nama_toko, t.slug, t.owner_name, t.owner_email, t.owner_phone, t.alamat, t.plan]
      );
      tenantIds.push(res.rows[0].id);
      console.log(`  ✅ ${t.nama_toko} (id: ${res.rows[0].id}, plan: ${t.plan})`);
    }

    // ========== 2. USERS ==========
    console.log("\n👤 Creating users...");

    const users = [
      // Toko Emas Enny
      { tenant_idx: 0, email: "enny@tokoeny.com", nama: "Enny Hartono", role: "admin", pass: "password123" },
      { tenant_idx: 0, email: "kasir1@tokoeny.com", nama: "Putri Wijaya", role: "kasir", pass: "kasir123" },
      { tenant_idx: 0, email: "kasir2@tokoeny.com", nama: "Rina Astuti", role: "kasir", pass: "kasir123" },
      // Toko Emas Jaya
      { tenant_idx: 1, email: "budi@tokojaya.com", nama: "Budi Santoso", role: "admin", pass: "password123" },
      { tenant_idx: 1, email: "sari@tokojaya.com", nama: "Sari Wulandari", role: "kasir", pass: "kasir123" },
      { tenant_idx: 1, email: "rudi@tokojaya.com", nama: "Rudi Hartono", role: "kasir", pass: "kasir123" },
      // Emas Mulia Surabaya
      { tenant_idx: 2, email: "dewi@emasabaya.com", nama: "Dewi Lestari", role: "admin", pass: "password123" },
      { tenant_idx: 2, email: "andi@emasabaya.com", nama: "Andi Prasetyo", role: "kasir", pass: "kasir123" },
      // Bengkel Emas Bandung
      { tenant_idx: 3, email: "ahmad@emasbandung.com", nama: "Ahmad Fauzi", role: "admin", pass: "password123" },
      { tenant_idx: 3, email: "maya@emasbandung.com", nama: "Maya Sari", role: "kasir", pass: "kasir123" },
    ];

    for (const u of users) {
      const hash = hashPassword(u.pass);
      await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, nama, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [tenantIds[u.tenant_idx], u.email, hash, u.nama, u.role]
      );
      console.log(`  ✅ ${u.email} (${u.role})`);
    }

    // ========== 3. LOGAM + KADAR (per tenant) ==========
    console.log("\n🪙 Cloning logam & kadar per tenant...");

    for (let i = 0; i < tenantIds.length; i++) {
      const tid = tenantIds[i];

      // Clone logam for this tenant
      await client.query(
        `INSERT INTO logam (id, nama, spot_price, buyback_ratio, ongkos_default, accent_color, icon, tenant_id)
         SELECT id, nama, spot_price, buyback_ratio, ongkos_default, accent_color, icon, $1
         FROM logam WHERE tenant_id IS NULL
         ON CONFLICT (id, tenant_id) DO NOTHING`,
        [tid]
      );

      // Clone kadar for tenant's logam
      await client.query(
        `INSERT INTO kadar (logam_id, label, nilai, is_lm, urutan)
         SELECT k.logam_id, k.label, k.nilai, k.is_lm, k.urutan
         FROM kadar k
         JOIN logam l ON k.logam_id = l.id
         WHERE l.tenant_id = $1
         ON CONFLICT DO NOTHING`,
        [tid]
      );
      console.log(`  ✅ Logam + kadar cloned for tenant ${i + 1}`);
    }

    // ========== 4. PRODUK ==========
    console.log("\n💍 Creating produk...");

    const produkTemplates = [
      // EMAS
      { logam_id: "emas", jenis: "Cincin", nama_prefix: "Cincin Emas", berat_min: 3, berat_max: 12, ongkos: 50000 },
      { logam_id: "emas", jenis: "Kalung", nama_prefix: "Kalung Emas", berat_min: 5, berat_max: 30, ongkos: 75000 },
      { logam_id: "emas", jenis: "Gelang", nama_prefix: "Gelang Emas", berat_min: 5, berat_max: 25, ongkos: 60000 },
      { logam_id: "emas", jenis: "Anting", nama_prefix: "Anting Emas", berat_min: 2, berat_max: 8, ongkos: 40000 },
      { logam_id: "emas", jenis: "Liontin", nama_prefix: "Liontin Emas", berat_min: 3, berat_max: 15, ongkos: 55000 },
      { logam_id: "emas", jenis: "Logam Mulia", nama_prefix: "LM Emas", berat_min: 1, berat_max: 50, ongkos: 0 },
      // PERAK
      { logam_id: "perak", jenis: "Cincin", nama_prefix: "Cincin Perak", berat_min: 5, berat_max: 20, ongkos: 15000 },
      { logam_id: "perak", jenis: "Kalung", nama_prefix: "Kalung Perak", berat_min: 10, berat_max: 50, ongkos: 20000 },
      { logam_id: "perak", jenis: "Gelang", nama_prefix: "Gelang Perak", berat_min: 8, berat_max: 30, ongkos: 15000 },
      // PLATINUM
      { logam_id: "platinum", jenis: "Cincin", nama_prefix: "Cincin Platinum", berat_min: 4, berat_max: 15, ongkos: 75000 },
      { logam_id: "platinum", jenis: "Kalung", nama_prefix: "Kalung Platinum", berat_min: 8, berat_max: 40, ongkos: 90000 },
      // EMAS PUTIH
      { logam_id: "emasputih", jenis: "Cincin", nama_prefix: "Cincin Emas Putih", berat_min: 3, berat_max: 12, ongkos: 80000 },
      { logam_id: "emasputih", jenis: "Kalung", nama_prefix: "Kalung Emas Putih", berat_min: 5, berat_max: 25, ongkos: 85000 },
      // PALLADIUM
      { logam_id: "palladium", jenis: "Cincin", nama_prefix: "Cincin Palladium", berat_min: 4, berat_max: 12, ongkos: 70000 },
    ];

    const allProdukIds = []; // { tenant_idx, produk_id, logam_id, berat }

    for (let i = 0; i < tenantIds.length; i++) {
      const tid = tenantIds[i];
      let kodeIdx = 1;

      for (const tpl of produkTemplates) {
        // 1-3 items per template
        const count = randInt(1, 3);
        for (let j = 0; j < count; j++) {
          const berat = randFloat(tpl.berat_min, tpl.berat_max);
          const nama = `${tpl.nama_prefix} ${berat}gr`;
          const kode = `${tpl.logam_id.toUpperCase().slice(0, 3)}${String(kodeIdx).padStart(4, "0")}`;
          const stok = tpl.logam_id === "emas" && tpl.jenis === "Logam Mulia" ? randInt(5, 50) : randInt(1, 5);

          const res = await client.query(
            `INSERT INTO produk (kode, logam_id, jenis, nama, berat_gram, ongkos_cetak, stok, tenant_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (kode) DO NOTHING
             RETURNING id`,
            [kode, tpl.logam_id, tpl.jenis, nama, berat, tpl.ongkos, stok, tid]
          );

          if (res.rows.length > 0) {
            allProdukIds.push({
              tenant_idx: i,
              produk_id: res.rows[0].id,
              logam_id: tpl.logam_id,
              berat,
            });
          }
          kodeIdx++;
        }
      }
      console.log(`  ✅ Tenant ${i + 1}: ${allProdukIds.filter((p) => p.tenant_idx === i).length} produk`);
    }

    // ========== 5. TRANSAKSI ==========
    console.log("\n💰 Creating transaksi (30 hari terakhir)...");

    const namaPihak = [
      "Rina Susanti", "Hendra Wijaya", "Lina Marlina", "Dodi Suhendra",
      "Siti Rahayu", "Bambang Setiawan", "Nurul Hidayat", "Eka Putri",
      "Tono Sugiarto", "Wati Susilawati", "Joko Widodo", "Ani Yulianti",
      "Hadi Sutrisno", "Mega Oktaviani", "Dedi Kurniawan", "Ratna Dewi",
      "Ari Setiawan", "Dina Permata", "Fandi Ahmad", "Yuni Astuti",
    ];

    const kontak = [
      "081234567890", "085678901234", "087890123456", "081122334455",
      "085566778899", "081987654321", "085321678901", "087654321098",
    ];

    let transIdx = 1;

    for (let i = 0; i < tenantIds.length; i++) {
      const tid = tenantIds[i];
      const tenantProduks = allProdukIds.filter((p) => p.tenant_idx === i);
      if (tenantProduks.length === 0) continue;

      // 30-60 transaksi per tenant
      const numTrans = randInt(30, 60);

      for (let t = 0; t < numTrans; t++) {
        const tipe = Math.random() > 0.3 ? "jual" : "buyback";
        const produk = tenantProduks[randInt(0, tenantProduks.length - 1)];
        const pihak = namaPihak[randInt(0, namaPihak.length - 1)];
        const hp = kontak[randInt(0, kontak.length - 1)];
        const jumlah = randInt(1, 3);
        const berat = randFloat(produk.berat * 0.8, produk.berat * 1.2);
        const diskon = Math.random() > 0.7 ? randInt(1, 5) * 10000 : 0;
        const tanggal = randomDate(new Date(Date.now() - 30 * 86400000), new Date());

        // Get spot price + kadar for this logam
        const logamRes = await client.query(
          `SELECT spot_price FROM logam WHERE id = $1 AND tenant_id = $2`,
          [produk.logam_id, tid]
        );
        const spotPrice = logamRes.rows[0]?.spot_price || 1000000;

        // Get a kadar for this logam
        const kadarRes = await client.query(
          `SELECT label, nilai FROM kadar WHERE logam_id = $1 LIMIT 1`,
          [produk.logam_id]
        );
        const kadarLabel = kadarRes.rows[0]?.label || "LM";
        const kadarNilai = kadarRes.rows[0]?.nilai || 0.999;

        let hargaPerGram, ongkosCetak, total;

        if (tipe === "jual") {
          hargaPerGram = Math.round(spotPrice * (1 + randFloat(0.05, 0.15))); // margin 5-15%
          const produkRes = await client.query(
            `SELECT ongkos_cetak FROM produk WHERE id = $1`,
            [produk.produk_id]
          );
          ongkosCetak = produkRes.rows[0]?.ongkos_cetak || 0;
          total = Math.round(berat * hargaPerGram + ongkosCetak * jumlah - diskon);
        } else {
          // Buyback: harga beli toko
          const buybackRatio = 0.95;
          hargaPerGram = Math.round(spotPrice * buybackRatio * kadarNilai);
          ongkosCetak = 0;
          total = Math.round(berat * hargaPerGram - diskon);
        }

        const bayar = tipe === "jual" ? total : 0;
        const kembalian = tipe === "jual" ? randInt(0, 1) * 50000 : 0;
        const noTrans = `${tipe === "jual" ? "JL" : "BB"}-${tanggal.toISOString().slice(0, 10).replace(/-/g, "")}-${String(transIdx).padStart(4, "0")}`;

        await client.query(
          `INSERT INTO transaksi (no_transaksi, tipe, logam_id, kadar_label, jenis_produk, nama_pihak, kontak, berat_gram, jumlah, harga_per_gram, ongkos_cetak, diskon, total, bayar, kembalian, tenant_id, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           ON CONFLICT (no_transaksi) DO NOTHING`,
          [
            noTrans, tipe, produk.logam_id, kadarLabel, produk.jenis === "Logam Mulia" ? "Logam Mulia" : produk.jenis,
            pihak, hp, berat, jumlah, hargaPerGram, ongkosCetak, diskon, total, bayar, kembalian,
            tid, tanggal,
          ]
        );
        transIdx++;
      }
      console.log(`  ✅ Tenant ${i + 1}: ${numTrans} transaksi`);
    }

    // ========== 6. LOG STOK ==========
    console.log("\n📋 Creating log_stok...");

    let logCount = 0;
    for (const p of allProdukIds.slice(0, 30)) {
      // Only first 30 produk
      const stokAwal = randInt(5, 20);
      const keluar = randInt(1, 5);
      const stokAkhir = stokAwal - keluar;

      if (stokAkhir >= 0) {
        await client.query(
          `INSERT INTO log_stok (produk_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan, created_at)
           VALUES ($1, 'masuk', $2, 0, $2, 'Stok awal', $3)`,
          [p.produk_id, stokAwal, randomDate(new Date(Date.now() - 30 * 86400000), new Date())]
        );
        await client.query(
          `INSERT INTO log_stok (produk_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan, created_at)
           VALUES ($1, 'keluar', $2, $3, $4, 'Penjualan', $5)`,
          [p.produk_id, keluar, stokAwal, stokAkhir, randomDate(new Date(Date.now() - 20 * 86400000), new Date())]
        );
        logCount += 2;
      }
    }
    console.log(`  ✅ ${logCount} log_stok entries`);

    // ========== 7. TENANT COUNTERS ==========
    console.log("\n📊 Creating tenant_counters...");

    const now = new Date();
    const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (let i = 0; i < tenantIds.length; i++) {
      const countRes = await client.query(
        `SELECT count(*) FROM transaksi WHERE tenant_id = $1`,
        [tenantIds[i]]
      );
      const produkCountRes = await client.query(
        `SELECT count(*) FROM produk WHERE tenant_id = $1`,
        [tenantIds[i]]
      );
      await client.query(
        `INSERT INTO tenant_counters (tenant_id, bulan, jumlah_transaksi, jumlah_produk)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, bulan) DO UPDATE SET jumlah_transaksi = $3, jumlah_produk = $4`,
        [tenantIds[i], bulan, parseInt(countRes.rows[0].count), parseInt(produkCountRes.rows[0].count)]
      );
    }
    console.log(`  ✅ Counters set for ${bulan}`);

    await client.query("COMMIT");

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEED DUMMY DATA SELESAI!");
    console.log("=".repeat(60));
    console.log("\n📦 Tenants:");
    for (let i = 0; i < tenants.length; i++) {
      console.log(`  ${i + 1}. ${tenants[i].nama_toko} (${tenants[i].plan})`);
    }
    console.log("\n👤 Users:");
    for (const u of users) {
      console.log(`  - ${u.email} / ${u.pass} (${u.role})`);
    }

    const totalProduk = await client.query("SELECT count(*) FROM produk");
    const totalTrans = await client.query("SELECT count(*) FROM transaksi");
    const totalUser = await client.query("SELECT count(*) FROM users");
    const totalTenant = await client.query("SELECT count(*) FROM tenants");
    const totalLogStok = await client.query("SELECT count(*) FROM log_stok");

    console.log("\n📊 Database summary:");
    console.log(`  Tenants: ${totalTenant.rows[0].count}`);
    console.log(`  Users: ${totalUser.rows[0].count}`);
    console.log(`  Produk: ${totalProduk.rows[0].count}`);
    console.log(`  Transaksi: ${totalTrans.rows[0].count}`);
    console.log(`  Log Stok: ${totalLogStok.rows[0].count}`);
    console.log("");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
