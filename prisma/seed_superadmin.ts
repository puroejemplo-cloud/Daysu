import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.adminUser.findFirst({ where: { role: "superadmin" } });
  if (existing) {
    console.log(`✓ Superadmin ya existe: ${existing.username}`);
    return;
  }

  const hash = await bcrypt.hash("Aura2026!", 12);

  const superadmin = await prisma.adminUser.create({
    data: {
      username: "superadmin",
      email:    "admin@auraproduciones.com",
      password: hash,
      fullName: "Super Administrador",
      suffix:   "SUP",
      role:     "superadmin",
    },
  });

  console.log("✓ Superadmin creado:");
  console.log(`  Usuario:    ${superadmin.username}`);
  console.log(`  Contraseña: Aura2026!`);
  console.log(`  Suffix:     [${superadmin.suffix}]`);
  console.log("\n⚠️  Cambia la contraseña inmediatamente después del primer login.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
