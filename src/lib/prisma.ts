import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada");

  const isRemote = !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");

  const pool = new Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    max: 5,
    connectionTimeoutMillis: 30000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log: ["error"] });
}

// Proxy lazy: createPrismaClient() se ejecuta solo en el primer acceso real (runtime),
// nunca al importar el módulo (build time). Evita crash cuando DATABASE_URL no está disponible.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const value = (globalForPrisma.prisma as any)[prop];
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
