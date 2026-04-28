import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  const packages = [
    {
      sku: "PKG-BASICO",
      name: "Paquete Básico",
      daily_rate: 4600.00,
      description: "DJ Versátil · Audio básico profesional · Cabina de DJ LED pixel · Souvenirs (globos). Ideal para eventos de día, bautizos y cumpleaños. Cubre hasta 200 personas. 5 hrs + 1 recepción.",
    },
    {
      sku: "PKG-MEDIANO",
      name: "Paquete Mediano",
      daily_rate: 8000.00,
      description: "DJ Versátil · Audio básico profesional · Cabina DJ LED pixel · Iluminación básica · Souvenirs (globos) · Show Robot Led (incluye botella de tequila p/shots & pirotecnia fría). 5 hrs + 1 recepción.",
    },
    {
      sku: "PKG-PREMIUM",
      name: "Paquete Premium",
      daily_rate: 14500.00,
      description: "DJ Versátil · Audio profesional hasta 200 px · DJ Booth pixel LED · Iluminación profesional · Show Cabezones (1) · Souvenirs · Show Robot Led · Maestro de ceremonias · Proyección de video · Video semblanza (gratis) · Pirotecnia inalámbrica (4 chisperos). 5 hrs + 1 recepción.",
    },
    {
      sku: "PKG-MASTER-VIP",
      name: "Master VIP",
      daily_rate: 19000.00,
      description: "DJ Versátil · Audio profesional 50-500 px · DJ Booth VIP · Iluminación profesional completa (4 robótica, 4 arquitectónica, 2 wash LED, 2 beam 7R, humo, láser, estrobo) · Cabezones (2) · Carrito 200 shots · Show Robot Led · Maestro de ceremonias · Proyección digital · Video semblanza · Pirotecnia (6 chisperos) · Animadores caracterizados · Limbo shot. 5 hrs + 1 recepción.",
    },
    {
      sku: "PKG-DIAMANTE",
      name: "Paquete Diamante",
      daily_rate: 21500.00,
      description: "Todo el Master VIP más: Shot jeringas · Arlequín en zancos · Vals en las nubes sencillo · Cañón de confeti metalizado · Carrito con 250 shots · Pirotecnia (6 chisperos). Agrega pista LED 5x5 por $8,000. 5 hrs + 1 recepción.",
    },
    {
      sku: "PKG-SNACK-TATOO",
      name: "Snack Tatoo",
      daily_rate: 24000.00,
      description: "Todo el Diamante más: Tatoo & glitter (tatuajes temporales personalizados) · Vals en las nubes doble. Agrega pista LED 5x5 por $8,000 o carrito maruchanfest (50 personas) por $2,000. 5 hrs + 1 recepción.",
    },
  ];

  console.log("Actualizando paquetes...");
  for (const pkg of packages) {
    await client.query(
      `UPDATE public.assets
       SET name = $1, daily_rate = $2, description = $3, updated_at = NOW()
       WHERE sku = $4`,
      [pkg.name, pkg.daily_rate, pkg.description, pkg.sku]
    );
    console.log(`✅ ${pkg.sku} → ${pkg.name} $${pkg.daily_rate.toLocaleString()}`);
  }

  client.release();
  await pool.end();
  console.log("\nListo. Todos los paquetes actualizados.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
