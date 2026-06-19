// scripts/run-migration.js
// Script untuk menjalankan migration 002_log_stok.sql
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL tidak diset!");
    console.error("Set DATABASE_URL di environment atau .env.local");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    
    try {
      console.log("Connected! Reading migration file...");
      const sql = fs.readFileSync(
        path.join(__dirname, "../migrations/002_log_stok.sql"),
        "utf8"
      );
      
      console.log("Running migration...");
      await client.query(sql);
      
      console.log("✅ Migration completed successfully!");
      
      // Verify
      const res = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('produk', 'log_stok')
      `);
      console.log("Tables:", res.rows.map(r => r.table_name).join(", "));
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (error.detail) console.error("Detail:", error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();