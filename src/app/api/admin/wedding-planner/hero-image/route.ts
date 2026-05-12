import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { extname } from "path";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("No autorizado", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return err("No se recibió archivo");

    const ext = extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(ext))
      return err("Formato no soportado. Usa JPG, PNG o WebP.");

    const blob = await put(`wedding/hero-${Date.now()}${ext}`, file, { access: "public" });

    await prisma.systemSetting.upsert({
      where: { key: "wp_hero_image" },
      update: { value: blob.url },
      create: { key: "wp_hero_image", value: blob.url },
    });

    return ok({ url: blob.url });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : "Error al subir imagen", 500);
  }
}
