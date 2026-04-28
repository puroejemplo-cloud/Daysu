import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, statSync, writeFileSync as writeFile } from "fs";
import { join, extname, basename } from "path";

const ORIG_DIR    = join(process.cwd(), "public", "Galeria");
const OUT_DIR     = join(process.cwd(), "public", "galeria");
const CONFIG_FILE = join(OUT_DIR, "_blur-config.json");
const ORDER_FILE  = join(OUT_DIR, "_order.json");
const EXTS        = [".jpg", ".jpeg", ".png"];

import type SharpType from "sharp";

interface BlurRegion { x: number; y: number; w: number; h: number }
type OverlayOptions = SharpType.OverlayOptions;

function loadConfig(): Record<string, BlurRegion[]> {
  try { return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")); } catch { return {}; }
}
function saveConfig(cfg: Record<string, BlurRegion[]>) {
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}
// Orden: array de nombres, más reciente primero
function loadOrder(): string[] {
  try { return JSON.parse(readFileSync(ORDER_FILE, "utf-8")); } catch { return []; }
}
function saveOrder(order: string[]) {
  writeFileSync(ORDER_FILE, JSON.stringify(order, null, 2));
}
function toWebpName(file: string) {
  return basename(file, extname(file))
    .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "") + ".webp";
}

// GET — lista de imágenes con sus regiones de blur guardadas
export async function GET() {
  const session = await auth();
  if (!session) return err("No autorizado", 401);
  // Cualquier admin puede ver/editar la galería
  if (!existsSync(ORIG_DIR)) return ok([]);

  const config = loadConfig();
  const files  = readdirSync(ORIG_DIR).filter((f) => EXTS.includes(extname(f).toLowerCase()));

  // Ordenar: primero los que están en el array de orden (más recientes), luego los demás
  const order  = loadOrder();
  const inOrder     = order.filter((f) => files.includes(f));
  const notInOrder  = files.filter((f) => !order.includes(f))
    .sort((a, b) => {
      try { return statSync(join(ORIG_DIR, b)).mtimeMs - statSync(join(ORIG_DIR, a)).mtimeMs; }
      catch { return 0; }
    });
  const sorted = [...inOrder, ...notInOrder];
  const ts     = Date.now();

  return ok(sorted.map((file) => {
    const webpExists = existsSync(join(OUT_DIR, toWebpName(file)));
    return {
      name:      file,
      original:  `/Galeria/${file}`,
      webp:      webpExists ? `/galeria/${toWebpName(file)}?v=${ts}` : null,
      regions:   config[file] ?? [],
      processed: webpExists,
    };
  }));
}

// POST — procesar imagen aplicando blur en regiones específicas
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { file, regions }: { file: string; regions: BlurRegion[] } = await req.json();
  if (!file) return err("Archivo requerido");

  const inputPath  = join(ORIG_DIR, file);
  const outputPath = join(OUT_DIR, toWebpName(file));
  if (!existsSync(inputPath)) return err("Archivo original no encontrado");

  const sharp = (await import("sharp")).default;
  const meta  = await sharp(inputPath).metadata();
  const W     = meta.width  ?? 1280;
  const H     = meta.height ?? 720;
  const maxW  = Math.min(W, 1400);
  const scale = maxW / W;
  const newW  = maxW;
  const newH  = Math.round(H * scale);

  // Redimensionar base
  let pipeline = sharp(inputPath).resize({ width: newW, withoutEnlargement: true });
  const base   = await pipeline.jpeg({ quality: 88 }).toBuffer();

  if (regions.length === 0) {
    // Sin blur — solo convertir
    await sharp(base).webp({ quality: 85 }).toFile(outputPath);
  } else {
    // Aplicar blur en cada región indicada
    const composites: OverlayOptions[] = [];
    for (const r of regions) {
      const rx = Math.max(0, Math.round(r.x * newW));
      const ry = Math.max(0, Math.round(r.y * newH));
      const rw = Math.min(newW - rx, Math.round(r.w * newW));
      const rh = Math.min(newH - ry, Math.round(r.h * newH));
      if (rw < 4 || rh < 4) continue;

      const blurred = await sharp(base)
        .extract({ left: rx, top: ry, width: rw, height: rh })
        .blur(16)
        .jpeg({ quality: 75 })
        .toBuffer();

      composites.push({ input: blurred, left: rx, top: ry, blend: "over" });
    }
    await sharp(base).composite(composites).webp({ quality: 82 }).toFile(outputPath);
  }

  // Guardar configuración de regiones
  const config  = loadConfig();
  config[file]  = regions;
  saveConfig(config);

  return ok({ ok: true, webp: `/galeria/${toWebpName(file)}` });
}

// PATCH — subir nueva imagen
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  mkdirSync(ORIG_DIR, { recursive: true });
  mkdirSync(OUT_DIR,  { recursive: true });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  if (!file) return err("No se recibió archivo");

  const ext = extname(file.name).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return err("Formato no soportado");

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Guardar original
  const safeName   = file.name.replace(/[^a-zA-Z0-9._\-+() ]/g, "-");
  const destPath   = join(ORIG_DIR, safeName);
  writeFile(destPath, buffer);

  // Procesar → WebP
  const sharp    = (await import("sharp")).default;
  const meta     = await sharp(buffer).metadata();
  const maxW     = Math.min(meta.width ?? 1280, 1400);
  const webpPath = join(OUT_DIR, toWebpName(safeName));
  await sharp(buffer).resize({ width: maxW, withoutEnlargement: true }).webp({ quality: 85 }).toFile(webpPath);

  // Agregar al principio del orden (más reciente primero)
  const order = loadOrder().filter((f) => f !== safeName);
  order.unshift(safeName);
  saveOrder(order);

  // Revalidar homepage
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");

  return ok({ name: safeName, webp: `/galeria/${toWebpName(safeName)}` });
}

// PUT — reprocesar TODAS las imágenes con sus configuraciones guardadas
export async function PUT() {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  if (!existsSync(ORIG_DIR)) return err("Carpeta Galeria no encontrada");

  const sharp  = (await import("sharp")).default;
  const config = loadConfig();
  const files  = readdirSync(ORIG_DIR).filter((f) => EXTS.includes(extname(f).toLowerCase()));

  const results: string[] = [];

  for (const file of files) {
    const inputPath  = join(ORIG_DIR, file);
    const outputPath = join(OUT_DIR, toWebpName(file));
    const regions    = config[file] ?? [];

    try {
      const meta  = await sharp(inputPath).metadata();
      const W     = meta.width  ?? 1280;
      const H     = meta.height ?? 720;
      const maxW  = Math.min(W, 1400);
      const scale = maxW / W;
      const newW  = maxW;
      const newH  = Math.round(H * scale);
      const base  = await sharp(inputPath)
        .resize({ width: newW, withoutEnlargement: true })
        .jpeg({ quality: 88 }).toBuffer();

      if (regions.length === 0) {
        await sharp(base).webp({ quality: 85 }).toFile(outputPath);
      } else {
        const composites: OverlayOptions[] = [];
        for (const r of regions) {
          const rx = Math.max(0, Math.round(r.x * newW));
          const ry = Math.max(0, Math.round(r.y * newH));
          const rw = Math.min(newW - rx, Math.round(r.w * newW));
          const rh = Math.min(newH - ry, Math.round(r.h * newH));
          if (rw < 4 || rh < 4) continue;
          const blurred = await sharp(base)
            .extract({ left: rx, top: ry, width: rw, height: rh })
            .blur(16).jpeg({ quality: 75 }).toBuffer();
          composites.push({ input: blurred, left: rx, top: ry, blend: "over" });
        }
        await sharp(base).composite(composites).webp({ quality: 82 }).toFile(outputPath);
      }
      results.push(file);
    } catch (e) {
      // continúa con las demás
    }
  }

  // Revalidar la homepage para que Next.js sirva las imágenes actualizadas
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
  revalidatePath("/catalogo");

  const { NextResponse } = await import("next/server");
  const response = NextResponse.json({ ok: true, data: { processed: results.length, files: results } });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
