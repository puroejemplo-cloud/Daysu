import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
  const c = await pool.connect();

  const dayRow = await c.query(`SELECT id FROM public.admin_users WHERE username='daysu' LIMIT 1`);
  const dayId  = dayRow.rows[0]?.id;
  const catRow = await c.query(`SELECT id FROM public.asset_categories WHERE name='Sonido' LIMIT 1`);
  const catId  = catRow.rows[0]?.id ?? 2;

  const packages = [
    {
      sku:       "DAY-DJ-AUDIO-100",
      name:      "DJ Versátil + Audio Básico (100 px)",
      desc:      "DJ Versátil mezclando en vivo varios géneros musicales + Audio básico profesional. Capacidad para hasta 100 personas. Cabina LED pixel incluida. 5 hrs + 1 recepción.",
      price:     3000,
      maxGuests: 100,
    },
    {
      sku:       "DAY-DJ-AUDIO-200",
      name:      "DJ Versátil + Audio Profesional (200 px)",
      desc:      "DJ Versátil mezclando en vivo + Audio profesional con capacidad para hasta 200 personas. Cabina LED pixel incluida. 5 hrs + 1 recepción.",
      price:     4500,
      maxGuests: 200,
    },
    {
      sku:       "DAY-DJ-AUDIO-500",
      name:      "DJ + Audio Profesional (500 px)",
      desc:      "DJ Versátil + Audio profesional completo con capacidad para 50 hasta 500 personas. Cabina LED pixel incluida. 5 hrs + 1 recepción.",
      price:     6000,
      maxGuests: 500,
    },
  ];

  console.log("Creando paquetes DJ+Audio...\n");
  for (const p of packages) {
    await c.query(
      `INSERT INTO public.assets
         (category_id, name, sku, description, total_units, daily_rate, max_guests,
          is_rentable, is_active, owner_admin_id, owner_suffix)
       VALUES ($1,$2,$3,$4,1,$5,$6,true,true,$7,'DAY')
       ON CONFLICT (sku) DO UPDATE
         SET name=$2, description=$4, daily_rate=$5, max_guests=$6,
             is_rentable=true, is_active=true, updated_at=NOW()`,
      [catId, p.name, p.sku, p.desc, p.price, p.maxGuests, dayId]
    );
    console.log(`  ✅ ${p.sku} — ${p.name} · $${p.price.toLocaleString()} · hasta ${p.maxGuests} px`);
  }

  c.release();
  await pool.end();
  console.log("\n✅ Paquetes creados. Edita los precios desde /admin/productos si lo necesitas.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
