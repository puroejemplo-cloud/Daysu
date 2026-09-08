import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const video = await prisma.galleryVideo.findUnique({ where: { id: Number(id) } });
  if (!video) return err("Video no encontrado", 404);

  const body = await req.json() as {
    title?: string; eventType?: string; packageAssetId?: number | null; order?: number;
  };

  const updated = await prisma.galleryVideo.update({
    where: { id: Number(id) },
    data: {
      ...(body.title      !== undefined && { title: body.title?.trim() || null }),
      ...(body.eventType  !== undefined && { eventType: body.eventType?.trim() || null }),
      ...(body.packageAssetId !== undefined && { packageAssetId: body.packageAssetId }),
      ...(body.order      !== undefined && { order: Number(body.order) }),
    },
    include: { packageAsset: { select: { id: true, name: true } } },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const video = await prisma.galleryVideo.findUnique({ where: { id: Number(id) } });
  if (!video) return err("Video no encontrado", 404);

  await prisma.galleryVideo.delete({ where: { id: Number(id) } });
  return ok({ message: "Video eliminado" });
}
