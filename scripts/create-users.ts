import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  const users = [
    {
      username: "superadmin",
      email:    "admin@aura.com",
      password: "Aura2026!",
      fullName: "Super Administrador",
      suffix:   "SUP",
      role:     "superadmin",
    },
    {
      username: "daysu",
      email:    "daysu@aura.com",
      password: "Daysu2026!",
      fullName: "Sonido Daysu",
      suffix:   "DAY",
      role:     "admin",
    },
    {
      username: "ivan",
      email:    "ivan@aura.com",
      password: "Ivan2026!",
      fullName: "DJ Iván Events",
      suffix:   "IVN",
      role:     "admin",
    },
  ];

  console.log("Creando usuarios...\n");
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await client.query(
      `INSERT INTO public.admin_users
         (username, email, password, full_name, suffix, role, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       ON CONFLICT (username) DO UPDATE
         SET password = EXCLUDED.password,
             full_name = EXCLUDED.full_name,
             updated_at = NOW()`,
      [u.username, u.email, hash, u.fullName, u.suffix, u.role]
    );
    console.log(`✅  ${u.role.toUpperCase().padEnd(12)} usuario: ${u.username.padEnd(12)} contraseña: ${u.password}`);
  }

  client.release();
  await pool.end();
  console.log("\nListo. Guarda bien estas credenciales.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
