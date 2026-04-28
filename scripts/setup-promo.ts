import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
  const c = await pool.connect();

  // 1. Columna original_price
  console.log("1. Agregando columna original_price...");
  await c.query(`ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);`);
  console.log("   ✅ Columna lista.");

  // 2. Admin "aura"
  console.log("2. Creando admin aura...");
  const hash = await bcrypt.hash("Aura2026#", 12);
  await c.query(
    `INSERT INTO public.admin_users (username, email, password, full_name, suffix, role, is_active)
     VALUES ('aura','aura@aura.com',$1,'Aura Producciones','AUR','admin',true)
     ON CONFLICT (username) DO UPDATE SET password=EXCLUDED.password, updated_at=NOW()`,
    [hash]
  );
  console.log("   ✅ Usuario: aura  Contraseña: Aura2026#");

  // 3. Categoría Fotografía (id puede variar)
  const catRes = await c.query(`SELECT id FROM public.asset_categories WHERE name='Fotografía' LIMIT 1`);
  const catId = catRes.rows[0]?.id ?? 4;

  // 4. Producto cabina fotográfica en oferta
  console.log("3. Creando producto cabina fotográfica oferta...");
  const auraAdmin = await c.query(`SELECT id FROM public.admin_users WHERE username='aura' LIMIT 1`);
  const adminId = auraAdmin.rows[0]?.id;

  await c.query(
    `INSERT INTO public.assets
       (category_id, name, sku, description, total_units, daily_rate, original_price,
        is_rentable, is_active, owner_admin_id, owner_suffix)
     VALUES ($1,$2,$3,$4,1,2800,3500,true,true,$5,'AUR')
     ON CONFLICT (sku) DO UPDATE
       SET name=EXCLUDED.name, description=EXCLUDED.description,
           daily_rate=EXCLUDED.daily_rate, original_price=EXCLUDED.original_price,
           owner_admin_id=EXCLUDED.owner_admin_id, owner_suffix=EXCLUDED.owner_suffix,
           updated_at=NOW()`,
    [
      catId,
      "Cabina Fotográfica",
      "CAB-FOTO-OFERTA",
      "📷 OFERTA ESPECIAL: Contrata 3 horas, paga 2.\n\nCabina fotográfica inflable LED de alta calidad. Incluye:\n• Props y accesorios temáticos (sombreros, antifaces, letreros, corbatas)\n• Galería digital — fotos enviadas directamente por WhatsApp\n• Impresión en sitio (disponible)\n• Iluminación LED RGB personalizable\n• Operador profesional durante todo el evento\n• Servicio para hasta 100 personas\n\nIdeal para: bautizos, cumpleaños, quinceañeras, bodas y eventos corporativos.\n\nCobertura: Zona conurbada Zacatecas–Guadalupe.\nContacto: 4929496372 · 4921291862",
      adminId,
    ]
  );
  console.log("   ✅ Cabina Fotográfica (oferta $2,800 · original $3,500)");

  c.release();
  await pool.end();
  console.log("\n✅ Todo listo.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
