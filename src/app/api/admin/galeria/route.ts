import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { put, del, list } from "@vercel/blob";
import { basename, extname } from "path";

type OverlayOptions = import("sharp").OverlayOptions;
interface BlurRegion { x: number; y: number; w: number; h: number }
interface BlurConfig  { [filename: string]: BlurRegion[] }

const P_ORIG     = "galeria/originals/";
const P_PROC     = "galeria/processed/";
const P_BLUR     = "galeria/config/blur.json";
const P_ORDER    = "galeria/config/order.json";
const P_CAROUSEL = "galeria/config/carousel.json";

function toWebpName(file: string): string {
  return basename(file, extname(file))
    .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "") + ".webp";
}

async function loadJson<T>(pathname: string, fallback: T): Promise<T> {
  try {
    const { blobs } = await list({ prefix: pathname });
    const b = blobs.find(x => x.pathname === pathname);
    if (!b) return fallback;
    const res = await fetch(b.url, { cache: "no-store" });
    return res.ok ? res.json() : fallback;
  } catch { return fallback; }
}

async function saveJson<T>(pathname: string, data: T): Promise<void> {
  // Delete existing before re-creating to avoid duplicates
  try {
    const { blobs } = await list({ prefix: pathname });
    const existing = blobs.find(x => x.pathname === pathname);
    if (existing) await del(existing.url);
  } catch { /* si falla el borrado, igual intentamos escribir */ }

  await put(pathname, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

async function putBlob(pathname: string, data: Buffer, contentType: string): Promise<void> {
  // Delete existing before re-creating
  try {
    const { blobs } = await list({ prefix: pathname });
    const existing = blobs.find(x => x.pathname === pathname);
    if (existing) await del(existing.url);
  } catch { /* continúa */ }

  await put(pathname, data, { access: "public", contentType, addRandomSuffix: false });
}

export async function GET() {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const [allBlobs, blurConfig, order, carousel] = await Promise.all([
    list({ prefix: "galeria/" }).then(r => r.blobs),
    loadJson<BlurConfig>(P_BLUR, {}),
    loadJson<string[]>(P_ORDER, []),
    loadJson<string[]>(P_CAROUSEL, []),
  ]);

  const originals = allBlobs.filter(b => b.pathname.startsWith(P_ORIG));
  const procSet   = new Set(
    allBlobs.filter(b => b.pathname.startsWith(P_PROC)).map(b => basename(b.pathname))
  );
  const procMap   = new Map(
    allBlobs.filter(b => b.pathname.startsWith(P_PROC)).map(b => [basename(b.pathname), b.url])
  );

  const fileMap    = new Map(originals.map(b => [basename(b.pathname), b]));
  const fileNames  = [...fileMap.keys()];
  const inOrder    = order.filter(n => fileMap.has(n));
  const notInOrder = fileNames.filter(n => !order.includes(n));
  const sorted     = [...inOrder, ...notInOrder];
  const ts         = Date.now();

  return ok(sorted.map(name => {
    const origBlob = fileMap.get(name)!;
    const webpName = toWebpName(name);
    const procUrl  = procMap.get(webpName) ?? null;
    return {
      name,
      original:   origBlob.url,
      webp:       procUrl ? `${procUrl}?v=${ts}` : null,
      regions:    blurConfig[name] ?? [],
      processed:  procSet.has(webpName),
      inCarousel: carousel.includes(name),
    };
  }));
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("No autorizado", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return err("No se recibió archivo");

    const ext = extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return err("Formato no soportado");

    const safeName = file.name
      .replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-").replace(/^-|-$/g, "");

    const buffer = Buffer.from(await file.arrayBuffer());

    const MIME: Record<string, string> = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png",  ".webp": "image/webp",
    };
    const contentType = MIME[ext] ?? "image/jpeg";

    await putBlob(P_ORIG + safeName, buffer, contentType);

    const sharp   = (await import("sharp")).default;
    const meta    = await sharp(buffer).metadata();
    const maxW    = Math.min(meta.width ?? 1280, 1400);
    const webpBuf = await sharp(buffer)
      .resize({ width: maxW, withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer();

    await putBlob(P_PROC + toWebpName(safeName), webpBuf, "image/webp");

    const order = await loadJson<string[]>(P_ORDER, []);
    await saveJson(P_ORDER, [safeName, ...order.filter(n => n !== safeName)]);

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");

    return ok({ name: safeName });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(`Error al subir: ${msg}`, 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { file, regions }: { file: string; regions: BlurRegion[] } = await req.json();
  if (!file) return err("Archivo requerido");

  const { blobs: origBlobs } = await list({ prefix: P_ORIG + file });
  const origBlob = origBlobs.find(b => b.pathname === P_ORIG + file);
  if (!origBlob) return err("Archivo original no encontrado");

  const origBuf = Buffer.from(await (await fetch(origBlob.url)).arrayBuffer());
  const sharp   = (await import("sharp")).default;
  const meta    = await sharp(origBuf).metadata();
  const W = meta.width ?? 1280, H = meta.height ?? 720;
  const maxW = Math.min(W, 1400), scale = maxW / W;
  const newW = maxW, newH = Math.round(H * scale);

  const base = await sharp(origBuf)
    .resize({ width: newW, withoutEnlargement: true })
    .jpeg({ quality: 88 }).toBuffer();

  let processed: Buffer;
  if (regions.length === 0) {
    processed = await sharp(base).webp({ quality: 85 }).toBuffer();
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
    processed = await sharp(base).composite(composites).webp({ quality: 82 }).toBuffer();
  }

  await putBlob(P_PROC + toWebpName(file), processed, "image/webp");

  const blurConfig = await loadJson<BlurConfig>(P_BLUR, {});
  blurConfig[file] = regions;
  await saveJson(P_BLUR, blurConfig);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");

  return ok({ ok: true, webp: P_PROC + toWebpName(file) });
}

// PUT — procesa UNA imagen (llamar una vez por imagen para evitar timeout)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { file }: { file: string } = await req.json();
  if (!file) return err("file requerido");

  const safeName = basename(file);

  const [origBlobs, blurConfig] = await Promise.all([
    list({ prefix: P_ORIG + safeName }).then(r => r.blobs),
    loadJson<BlurConfig>(P_BLUR, {}),
  ]);

  const origBlob = origBlobs.find(b => b.pathname === P_ORIG + safeName);
  if (!origBlob) return err("Archivo original no encontrado");

  const regions = blurConfig[safeName] ?? [];

  const origBuf = Buffer.from(await (await fetch(origBlob.url)).arrayBuffer());
  const sharp   = (await import("sharp")).default;
  const meta    = await sharp(origBuf).metadata();
  const W = meta.width ?? 1280, H = meta.height ?? 720;
  const maxW = Math.min(W, 1400), scale = maxW / W;
  const newW = maxW, newH = Math.round(H * scale);

  const base = await sharp(origBuf)
    .resize({ width: newW, withoutEnlargement: true })
    .jpeg({ quality: 88 }).toBuffer();

  let processed: Buffer;
  if (regions.length === 0) {
    processed = await sharp(base).webp({ quality: 85 }).toBuffer();
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
    processed = await sharp(base).composite(composites).webp({ quality: 82 }).toBuffer();
  }

  await putBlob(P_PROC + toWebpName(safeName), processed, "image/webp");

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");

  return ok({ processed: safeName });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { file } = await req.json() as { file: string };
  if (!file) return err("Archivo requerido");
  const safeName = basename(file);

  const { blobs } = await list({ prefix: "galeria/" });
  const toDelete  = blobs.filter(
    b => b.pathname === P_ORIG + safeName || b.pathname === P_PROC + toWebpName(safeName)
  );
  if (toDelete.length > 0) await del(toDelete.map(b => b.url));

  const [blurConfig, order, carousel] = await Promise.all([
    loadJson<BlurConfig>(P_BLUR, {}),
    loadJson<string[]>(P_ORDER, []),
    loadJson<string[]>(P_CAROUSEL, []),
  ]);
  delete blurConfig[safeName];

  await Promise.all([
    saveJson(P_BLUR,     blurConfig),
    saveJson(P_ORDER,    order.filter(n => n !== safeName)),
    saveJson(P_CAROUSEL, carousel.filter(n => n !== safeName)),
  ]);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");

  return ok({ deleted: safeName });
}
