import "dotenv/config";
import fs from "fs";
import crypto from "crypto";
import { prisma } from "../src/lib/prisma";

const MIGRATION_DIR = "20260908200418_add_gallery_videos";
const sqlPath = `prisma/migrations/${MIGRATION_DIR}/migration.sql`;

async function main() {
  const sql = fs.readFileSync(sqlPath, "utf8");
  const checksum = crypto.createHash("sha256").update(sql).digest("hex");

  const exists = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gallery_videos') as exists`
  );
  if (exists[0]?.exists) {
    console.log("La tabla gallery_videos ya existe, nada que hacer.");
    return;
  }

  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    console.log("Ejecutando:", stmt.slice(0, 60).replace(/\n/g, " "), "...");
    await prisma.$executeRawUnsafe(stmt);
  }

  console.log("Migración aplicada. checksum:", checksum);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
