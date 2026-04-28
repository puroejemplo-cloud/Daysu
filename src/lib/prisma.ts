import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Sin DATABASE_URL (ej: build sin env vars) — cliente sin adapter.
    // Falla en runtime al hacer queries, no en build time.
    return new PrismaClient({ log: ["error"] });
  }

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

export const prisma = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
