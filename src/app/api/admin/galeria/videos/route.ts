import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

// Acepta ID crudo, youtu.be/ID, youtube.com/watch?v=ID o /shorts/ID
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1) || null;
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const match = url.pathname.match(/\/(shorts|embed)\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    return null;
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const videos = await prisma.galleryVideo.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { packageAsset: { select: { id: true, name: true } } },
  });
  return ok(videos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const body = await req.json() as { url?: string; title?: string; eventType?: string; packageAssetId?: number | null };
  if (!body.url?.trim()) return err("El link de YouTube es requerido");

  const youtubeId = extractYoutubeId(body.url);
  if (!youtubeId) return err("No se pudo reconocer el link de YouTube");

  const video = await prisma.galleryVideo.create({
    data: {
      youtubeId,
      title: body.title?.trim() || null,
      eventType: body.eventType?.trim() || null,
      packageAssetId: body.packageAssetId ?? null,
    },
    include: { packageAsset: { select: { id: true, name: true } } },
  });
  return ok(video, 201);
}
