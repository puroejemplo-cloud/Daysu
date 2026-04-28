import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
  const c = await pool.connect();

  // Obtener IDs de admins
  const daysu = await c.query(`SELECT id FROM public.admin_users WHERE username='daysu' LIMIT 1`);
  const aura  = await c.query(`SELECT id FROM public.admin_users WHERE username='aura'  LIMIT 1`);

  const dayId  = daysu.rows[0]?.id;
  const auraId = aura.rows[0]?.id;

  if (!dayId || !auraId) { console.log("❌ No se encontraron los admins"); process.exit(1); }

  // Asignar los 6 paquetes a Daysu (DAY)
  const paquetes = ["PKG-BASICO","PKG-MEDIANO","PKG-PREMIUM","PKG-MASTER-VIP","PKG-DIAMANTE","PKG-SNACK-TATOO"];
  for (const sku of paquetes) {
    await c.query(
      `UPDATE public.assets SET owner_admin_id=$1, owner_suffix='DAY', updated_at=NOW() WHERE sku=$2`,
      [dayId, sku]
    );
    console.log(`✅ ${sku} → DAY (Sonido Daysu)`);
  }

  // Confirmar que Cabina Fotográfica sigue siendo de AUR
  await c.query(
    `UPDATE public.assets SET owner_admin_id=$1, owner_suffix='AUR', updated_at=NOW() WHERE sku='CAB-FOTO-OFERTA'`,
    [auraId]
  );
  console.log(`✅ CAB-FOTO-OFERTA → AUR (Aura Producciones)`);

  c.release();
  await pool.end();
  console.log("\nListo. Propietarios asignados correctamente.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
