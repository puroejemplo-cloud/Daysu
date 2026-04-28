import "dotenv/config";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  const sql = readFileSync(
    join(__dirname, "../prisma/migrations/20260425000000_eventmaster_initial/migration.sql"),
    "utf-8"
  );

  console.log("Conectando a Supabase...");
  const client = await pool.connect();
  try {
    console.log("Aplicando migración...");
    await client.query(sql);
    console.log("✅ Tablas y datos creados exitosamente.");
  } catch (err: any) {
    if (err.message?.includes("already exists")) {
      console.log("⚠️  Las tablas ya existen — omitiendo.");
    } else {
      throw err;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
