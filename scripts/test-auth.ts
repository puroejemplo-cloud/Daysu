import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
  const c = await pool.connect();

  console.log("Verificando usuarios en BD...\n");

  const res = await c.query(`SELECT id, username, full_name, suffix, role, is_active, LEFT(password,20) as pw_preview FROM public.admin_users`);

  if (res.rows.length === 0) {
    console.log("❌ No hay usuarios en admin_users!");
  } else {
    for (const u of res.rows) {
      console.log(`  ✅ ID:${u.id} | usuario:${u.username} | nombre:${u.full_name} | role:${u.role} | activo:${u.is_active}`);
    }
  }

  console.log("\nVerificando contraseñas...");
  const tests = [
    { username: "superadmin", password: "Aura2026!" },
    { username: "daysu",      password: "Daysu2026!" },
    { username: "ivan",       password: "Ivan2026!"  },
    { username: "aura",       password: "Aura2026#"  },
  ];

  for (const t of tests) {
    const row = await c.query(`SELECT password FROM public.admin_users WHERE username=$1`, [t.username]);
    if (!row.rows[0]) {
      console.log(`  ❌ ${t.username}: NO EXISTE`);
      continue;
    }
    const valid = await bcrypt.compare(t.password, row.rows[0].password);
    console.log(`  ${valid ? "✅" : "❌"} ${t.username} / ${t.password}: ${valid ? "OK" : "FALLA"}`);
  }

  c.release();
  await pool.end();
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
