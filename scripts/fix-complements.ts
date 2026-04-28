import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
  const c = await pool.connect();

  // 1. Activar como rentables independientes (aparecerán como complemento para TODOS los paquetes)
  const rentables = ["DAY-MARUCHAN", "DAY-PISTA-LED"];
  for (const sku of rentables) {
    await c.query(`UPDATE public.assets SET is_rentable=true, updated_at=NOW() WHERE sku=$1`, [sku]);
    console.log(`✅ ${sku} → is_rentable = true`);
  }

  // 2. Unificar nombre "Cabina LED" en todos los productos que lo mencionan
  const cabinaFixes = [
    { sku: "PKG-BASICO",  field: null, note: "Cabina LED ya en features" },
    { sku: "DAY-DJ-BOOTH", name: "Cabina LED pixel (DJ Booth)", note: "" },
  ];
  await c.query(`UPDATE public.assets SET name='Cabina LED pixel (DJ Booth)', updated_at=NOW() WHERE sku='DAY-DJ-BOOTH'`);
  console.log("✅ DAY-DJ-BOOTH renombrado a 'Cabina LED pixel (DJ Booth)'");

  // 3. Actualizar capacidad para Maruchan y Pista LED
  await c.query(`UPDATE public.assets SET max_guests=50   WHERE sku='DAY-MARUCHAN'`);
  await c.query(`UPDATE public.assets SET max_guests=500  WHERE sku='DAY-PISTA-LED'`);
  console.log("✅ Capacidades actualizadas");

  c.release();
  await pool.end();
  console.log("\nListo.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
