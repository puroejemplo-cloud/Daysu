import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Configuración del sistema
  await prisma.systemSetting.upsert({
    where: { key: "payment_hold_hours" },
    update: {},
    create: { key: "payment_hold_hours", value: "48" },
  });

  // Categorías base de activos
  const categories = [
    { name: "Sonido", description: "Equipos de audio, bocinas, micrófonos y accesorios" },
    { name: "Cabinas", description: "Cabinas DJ, iluminación y periféricos" },
    { name: "Carritos de Comida", description: "Carritos, stands gastronómicos y accesorios" },
    { name: "Mobiliario", description: "Mesas, sillas, carpas y decoración" },
    { name: "Componentes", description: "Cables, bases y accesorios internos (no rentables directamente)" },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.upsert({
      where: { id: (await prisma.assetCategory.findFirst({ where: { name: cat.name } }))?.id ?? 0 },
      update: {},
      create: cat,
    });
  }

  console.log("✓ Seed completado: system_settings y categorías base creadas");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
