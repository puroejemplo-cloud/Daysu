import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  const c = await pool.connect();

  // 1. Crear categorías de tipo de evento
  const cats = [
    { name: "Fiestas & Cumpleaños",  desc: "Bautizos, cumpleaños y eventos de día" },
    { name: "XV Años",               desc: "Quinceañeras y XV Años" },
    { name: "Bodas",                 desc: "Bodas y eventos nupciales" },
    { name: "Eventos VIP",           desc: "Eventos premium y de lujo" },
    { name: "Especiales",            desc: "Paquetes con extras únicos" },
  ];

  console.log("Creando categorías de evento...");
  const catIds: Record<string, number> = {};

  for (const cat of cats) {
    // Insertar si no existe
    const res = await c.query(
      `INSERT INTO public.asset_categories (name, description)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cat.name, cat.desc]
    );
    if (res.rows[0]) {
      catIds[cat.name] = res.rows[0].id;
      console.log(`  ✅ Nueva: "${cat.name}" (id ${catIds[cat.name]})`);
    } else {
      const existing = await c.query(`SELECT id FROM public.asset_categories WHERE name = $1`, [cat.name]);
      catIds[cat.name] = existing.rows[0].id;
      console.log(`  ⏭  Ya existe: "${cat.name}" (id ${catIds[cat.name]})`);
    }
  }

  // 2. Asignar categoría a cada paquete
  const assignments = [
    { sku: "PKG-BASICO",      cat: "Fiestas & Cumpleaños", reason: "Eventos de día, bautizos, cumpleaños" },
    { sku: "PKG-MEDIANO",     cat: "XV Años",              reason: "Quinceañeras con show robot" },
    { sku: "PKG-PREMIUM",     cat: "XV Años",              reason: "XV Años con producción completa" },
    { sku: "PKG-MASTER-VIP",  cat: "Bodas",                reason: "Bodas y eventos 50-500 personas" },
    { sku: "PKG-DIAMANTE",    cat: "Eventos VIP",          reason: "Producción VIP con vals y pirotecnia" },
    { sku: "PKG-SNACK-TATOO", cat: "Especiales",           reason: "Paquete con tatoo, snacks y extras" },
  ];

  console.log("\nAsignando categorías a paquetes...");
  for (const a of assignments) {
    await c.query(
      `UPDATE public.assets SET category_id = $1, updated_at = NOW() WHERE sku = $2`,
      [catIds[a.cat], a.sku]
    );
    console.log(`  ✅ ${a.sku} → "${a.cat}"  (${a.reason})`);
  }

  c.release();
  await pool.end();
  console.log("\nListo. Categorías asignadas correctamente.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
