import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const isRemote = !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");

  // Transaction pooler (puerto 6543): cada query obtiene una conexión nueva del pool
  // No hay conexiones idle — sin timeouts de inactividad
  const pool = new Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    max: 5,
    connectionTimeoutMillis: 30000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
