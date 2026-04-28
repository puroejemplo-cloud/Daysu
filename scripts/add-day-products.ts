import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
  const c = await pool.connect();

  // IDs de admin y categorías
  const dayRow = await c.query(`SELECT id FROM public.admin_users WHERE username='daysu' LIMIT 1`);
  const dayId  = dayRow.rows[0]?.id;
  if (!dayId) { console.log("❌ No encontré al admin daysu"); process.exit(1); }

  const cats = await c.query(`SELECT id, name FROM public.asset_categories`);
  const catId: Record<string, number> = {};
  for (const r of cats.rows) catId[r.name] = r.id;

  // Ids de categorías usadas
  const SONIDO   = catId["Sonido"]         ?? 2;
  const ILUM     = catId["Iluminación"]    ?? 3;
  const ENTRET   = catId["Entretenimiento"]?? 5;

  const products = [
    // ─── SONIDO & DJ ─────────────────────────────────────────────────────────
    { sku:"DAY-DJ-VERSATIL",    name:"DJ Versátil",
      desc:"DJ mezclando en vivo, varios géneros musicales. Para todo público.",
      price:2500, cat:SONIDO },
    { sku:"DAY-AUDIO-BASICO",   name:"Audio Básico Profesional",
      desc:"Sistema de audio básico con capacidad de hasta 200 invitados.",
      price:1500, cat:SONIDO },
    { sku:"DAY-AUDIO-COMPLETO", name:"Audio Profesional Completo",
      desc:"Sistema de audio profesional con capacidad de 50 a 500 invitados.",
      price:3500, cat:SONIDO },
    { sku:"DAY-DJ-BOOTH",       name:"DJ Booth (Cabina LED pixel)",
      desc:"Moderna y elegante cabina VIP para DJ con iluminación LED pixel.",
      price:1000, cat:SONIDO },

    // ─── ILUMINACIÓN ─────────────────────────────────────────────────────────
    { sku:"DAY-ILUM-BASICA",    name:"Iluminación Básica",
      desc:"Iluminación básica de escenario para eventos.",
      price:800, cat:ILUM },
    { sku:"DAY-ILUM-PRO",       name:"Iluminación Profesional Completa",
      desc:"4 mini robótica · 4 arquitectónica · 2 wash LED · 2 beam 7R · máquina de humo · láser · estrobo.",
      price:3000, cat:ILUM },

    // ─── SHOW & ENTRETENIMIENTO ───────────────────────────────────────────────
    { sku:"DAY-ROBOT-LED",      name:"Show Robot Led",
      desc:"Robot LED interactivo. Incluye botella de tequila para shots y pirotecnia fría.",
      price:2500, cat:ENTRET },
    { sku:"DAY-MAESTRO-CER",    name:"Maestro de Ceremonias",
      desc:"Maestro de ceremonias que dirige el vals y ameniza el evento.",
      price:1500, cat:ENTRET },
    { sku:"DAY-PROYECCION",     name:"Proyección de Video",
      desc:"Proyección digital para el evento.",
      price:800, cat:ENTRET },
    { sku:"DAY-VIDEO-SEM",      name:"Video Semblanza",
      desc:"Presentación animada musicalizada con fotografías y videos del festejado.",
      price:500, cat:ENTRET },
    { sku:"DAY-PIROT-4",        name:"Pirotecnia Inalámbrica (4 chisperos)",
      desc:"4 chisperos de pirotecnia fría inalámbrica.",
      price:800, cat:ENTRET },
    { sku:"DAY-PIROT-6",        name:"Pirotecnia Inalámbrica (6 chisperos)",
      desc:"6 chisperos de pirotecnia fría inalámbrica.",
      price:1200, cat:ENTRET },
    { sku:"DAY-ANIMADORES",     name:"Animadores Caracterizados",
      desc:"Personal encargado de amenizar, caracterizados con botargas: perrito, gorila, caballito, tiburón, luchador, máscaras, etc.",
      price:1500, cat:ENTRET },
    { sku:"DAY-CABEZONES-1",    name:"Show Cabezones (1 a elegir)",
      desc:"1 Cabezon a elegir: Luis Miguel, Jaime Duende, Abelito o Bad Bunny.",
      price:800, cat:ENTRET },
    { sku:"DAY-CABEZONES-2",    name:"Show Cabezones (2 a elegir)",
      desc:"2 Cabezones a elegir: Luis Miguel, Jaime Duende, Abelito, Bad Bunny.",
      price:1400, cat:ENTRET },
    { sku:"DAY-LIMBO",          name:"Limbo Shot",
      desc:"Show de limbo con shots para los participantes.",
      price:500, cat:ENTRET },
    { sku:"DAY-SHOT-JERINGAS",  name:"Shot Jeringas",
      desc:"Servicio de shots en jeringas para los invitados.",
      price:300, cat:ENTRET },
    { sku:"DAY-SOUVENIRS",      name:"Souvenirs (Regalos Sorpresa)",
      desc:"Globos, antifaces, sombreros, corbatas como regalos de animación.",
      price:400, cat:ENTRET },
    { sku:"DAY-SHOTS-200",      name:"Carrito de Shots 200 pzas",
      desc:"Carrito con 200 shots de piña colada, pantera rosa y vampiro.",
      price:1500, cat:ENTRET },
    { sku:"DAY-SHOTS-250",      name:"Carrito de Shots 250 pzas",
      desc:"Carrito con 250 shots de piña colada, pantera rosa y vampiro.",
      price:1800, cat:ENTRET },
    { sku:"DAY-ARLEQUIN",       name:"Arlequín en Zancos",
      desc:"Arlequín en zancos con media hora de servicio.",
      price:1000, cat:ENTRET },
    { sku:"DAY-VALS-SENCILLO",  name:"Vals en las Nubes (Sencillo)",
      desc:"Efecto de humo tipo niebla sobre el piso para el vals.",
      price:1200, cat:ENTRET },
    { sku:"DAY-VALS-DOBLE",     name:"Vals en las Nubes (Doble)",
      desc:"Efecto de humo doble tipo niebla sobre el piso para el vals.",
      price:1800, cat:ENTRET },
    { sku:"DAY-CONFETI",        name:"Cañón de Confeti Metalizado",
      desc:"Cañón de confeti metalizado (1 disparo).",
      price:600, cat:ENTRET },
    { sku:"DAY-TATOO-GLITTER",  name:"Tatoo & Glitter",
      desc:"Tatuajes temporales artísticos personalizados y glitter para los invitados.",
      price:800, cat:ENTRET },
    { sku:"DAY-MARUCHAN",       name:"Carrito Maruchanfest (50 personas)",
      desc:"Carrito de maruchan (sopa instantánea) para 50 personas.",
      price:2000, cat:ENTRET },
    { sku:"DAY-PISTA-LED",      name:"Pista de Baile LED Cristal Infinito 5x5",
      desc:"Pista de baile LED cristal infinito 5×5 metros.",
      price:8000, cat:ENTRET },
  ];

  console.log(`Creando ${products.length} productos para DAY (Sonido Daysu)...\n`);
  let created = 0, skipped = 0;

  for (const p of products) {
    try {
      await c.query(
        `INSERT INTO public.assets
           (category_id, name, sku, description, total_units, daily_rate,
            is_rentable, is_active, owner_admin_id, owner_suffix)
         VALUES ($1,$2,$3,$4,1,$5,false,true,$6,'DAY')
         ON CONFLICT (sku) DO NOTHING`,
        [p.cat, p.name, p.sku, p.desc, p.price, dayId]
      );
      console.log(`  ✅ ${p.sku.padEnd(22)} → $${p.price.toLocaleString().padStart(6)} | ${p.name}`);
      created++;
    } catch (e: unknown) {
      console.log(`  ⏭  ${p.sku} ya existe`);
      skipped++;
    }
  }

  c.release();
  await pool.end();
  console.log(`\n✅ ${created} productos creados${skipped ? `, ${skipped} omitidos (ya existían)` : ""}.`);
  console.log("💡 Están en isRentable=false. Actívalos como rentables desde /admin/productos.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
