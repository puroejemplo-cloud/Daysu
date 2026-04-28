import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
  const c = await pool.connect();

  // 1. Columna max_guests
  await c.query(`ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS max_guests INTEGER;`);
  console.log("✅ Columna max_guests agregada.");

  // 2. Capacidad de los paquetes (según flyers)
  const updates = [
    { sku: "PKG-BASICO",      max: 200,  note: "Audio básico hasta 200 px" },
    { sku: "PKG-MEDIANO",     max: 200,  note: "Audio básico hasta 200 px" },
    { sku: "PKG-PREMIUM",     max: 200,  note: "Audio básico hasta 200 px" },
    { sku: "PKG-MASTER-VIP",  max: 500,  note: "Audio 50-500 px" },
    { sku: "PKG-DIAMANTE",    max: 500,  note: "Audio completo 50-500 px" },
    { sku: "PKG-SNACK-TATOO", max: 500,  note: "Audio completo 50-500 px" },
    { sku: "CAB-FOTO-OFERTA", max: 100,  note: "Cabina para hasta 100 personas" },
    // Productos individuales DAY
    { sku: "DAY-AUDIO-BASICO",   max: 200, note: "" },
    { sku: "DAY-AUDIO-COMPLETO", max: 500, note: "" },
    { sku: "DAY-DJ-VERSATIL",    max: 500, note: "" },
    { sku: "DAY-ILUM-PRO",       max: 500, note: "" },
    { sku: "DAY-ILUM-BASICA",    max: 200, note: "" },
  ];

  for (const u of updates) {
    await c.query(`UPDATE public.assets SET max_guests=$1 WHERE sku=$2`, [u.max, u.sku]);
    console.log(`  ✅ ${u.sku} → ${u.max} px`);
  }

  c.release();
  await pool.end();
  console.log("\nListo.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
