// scripts/seed-tenant.js
// Script untuk membuat tenant demo
const { Pool } = require("pg");
const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();

    // Buat tenant demo
    const tenantRes = await client.query(
      `INSERT INTO tenants (nama_toko, slug, owner_name, owner_email, owner_phone, plan)
       VALUES ($1, $2, $3, $4, $5, 'pro')
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      ["Toko Emas Jaya", "tokojaya", "Budi Santoso", "budi@tokojaya.com", "081234567890"]
    );

    if (tenantRes.rows.length === 0) {
      console.log("Tenant sudah ada, skip...");
      const existing = await client.query("SELECT id FROM tenants WHERE slug = 'tokojaya'");
      var tenantId = existing.rows[0].id;
    } else {
      var tenantId = tenantRes.rows[0].id;
      console.log("Tenant created:", tenantId);
    }

    // Buat user owner
    const passHash = hashPassword("password123");
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, nama, role)
       VALUES ($1, $2, $3, $4, 'owner')
       ON CONFLICT (email) DO NOTHING`,
      [tenantId, "budi@tokojaya.com", passHash, "Budi Santoso"]
    );
    console.log("User created: budi@tokojaya.com / password123");

    // Buat user kasir
    const kasirHash = hashPassword("kasir123");
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, nama, role)
       VALUES ($1, $2, $3, $4, 'kasir')
       ON CONFLICT (email) DO NOTHING`,
      [tenantId, "sari@tokojaya.com", kasirHash, "Sari Wulandari"]
    );
    console.log("User created: sari@tokojaya.com / kasir123");

    // Clone logam + kadar untuk tenant
    await client.query(
      `INSERT INTO logam (id, nama, spot_price, buyback_ratio, ongkos_default, accent_color, icon, tenant_id)
       SELECT id, nama, spot_price, buyback_ratio, ongkos_default, accent_color, icon, $1
       FROM logam WHERE tenant_id IS NULL
       ON CONFLICT DO NOTHING`,
      [tenantId]
    );

    await client.query(
      `INSERT INTO kadar (logam_id, label, nilai, is_lm, urutan)
       SELECT k.logam_id, k.label, k.nilai, k.is_lm, k.urutan
       FROM kadar k
       JOIN logam l ON k.logam_id = l.id
       WHERE l.tenant_id = $1
       ON CONFLICT DO NOTHING`,
      [tenantId]
    );
    console.log("Logam + kadar cloned untuk tenant");

    console.log("\n✅ Seed completed!");
    console.log("Login: budi@tokojaya.com / password123");

    client.release();
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
  } finally {
    await pool.end();
  }
}

seed();