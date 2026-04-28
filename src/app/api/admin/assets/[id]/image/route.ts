import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { join, extname } from "path";
import { mkdirSync, writeFileSync } from "fs";

const OUT_DIR = join(process.cwd(), "public", "productos");

type Params = { params: Promise<{ id: string }> };

// POST — sube una foto y la agrega a imageGallery[]
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return err("No autenticado", 401);
    const { id } = await params;

    const asset = await prisma.asset.findUnique({ where: { id: Number(id) } });
    if (!asset) return err("Activo no encontrado", 404);

    const isSuperAdmin = session.user.role === "superadmin";
    const isOwner      = asset.ownerAdminId === Number(session.user.id);
    if (!isSuperAdmin && !isOwner) return err("Sin permisos", 403);

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    if (!file) return err("No se recibió archivo");

    const ext = extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(ext))
      return err("Formato no soportado. Usa JPG, PNG o WebP.");

    mkdirSync(OUT_DIR, { recursive: true });

    // Nombre único: sku + timestamp
    const safeName = `${asset.sku.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${Date.now()}${ext}`;
    writeFileSync(join(OUT_DIR, safeName), Buffer.from(await file.arrayBuffer()));

    const imageUrl   = `/productos/${safeName}`;
    const current    = (asset.imageGallery as string[] | null) ?? [];
    const newGallery = [...current, imageUrl];

    // La primera imagen también se asigna como imageUrl principal
    await prisma.asset.update({
      where: { id: Number(id) },
      data: {
        imageGallery: newGallery,
        imageUrl:     newGallery[0],
      },
    });

    return ok({ imageUrl, gallery: newGallery });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : "Error al subir imagen", 500);
  }
}

// DELETE — elimina una foto de la galería por URL
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return err("No autenticado", 401);
    const { id } = await params;

    const asset = await prisma.asset.findUnique({ where: { id: Number(id) } });
    if (!asset) return err("Activo no encontrado", 404);

    const isSuperAdmin = session.user.role === "superadmin";
    const isOwner      = asset.ownerAdminId === Number(session.user.id);
    if (!isSuperAdmin && !isOwner) return err("Sin permisos", 403);

    const { imageUrl } = await req.json() as { imageUrl: string };
    if (!imageUrl) return err("imageUrl requerido");

    const current    = (asset.imageGallery as string[] | null) ?? [];
    const newGallery = current.filter((u) => u !== imageUrl);

    await prisma.asset.update({
      where: { id: Number(id) },
      data: {
        imageGallery: newGallery,
        imageUrl:     newGallery[0] ?? null,
      },
    });

    return ok({ gallery: newGallery });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : "Error al eliminar imagen", 500);
  }
}
