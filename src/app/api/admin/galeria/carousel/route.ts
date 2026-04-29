import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { put, del, list } from "@vercel/blob";

const P_CAROUSEL = "galeria/config/carousel.json";

async function loadCarousel(): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix: P_CAROUSEL });
    const b = blobs.find(x => x.pathname === P_CAROUSEL);
    if (!b) return [];
    const res = await fetch(b.url, { cache: "no-store" });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export async function GET() {
  const session = await auth();
  if (!session) return err("No autorizado", 401);
  return ok(await loadCarousel());
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { files } = await req.json() as { files: string[] };
  if (!Array.isArray(files)) return err("files debe ser un array");

  // Delete existing before re-creating
  try {
    const { blobs } = await list({ prefix: P_CAROUSEL });
    const existing = blobs.find(x => x.pathname === P_CAROUSEL);
    if (existing) await del(existing.url);
  } catch { /* continúa */ }

  await put(P_CAROUSEL, JSON.stringify(files), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");

  return ok({ saved: files.length });
}
