import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

// GET /api/admin/settings — devuelve todos los system_settings
export async function GET() {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  return ok(settings);
}

// PATCH /api/admin/settings — actualiza un setting por clave
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const body = await req.json() as { key: string; value: string };
  if (!body?.key || body.value === undefined) return err("key y value son requeridos");

  const updated = await prisma.systemSetting.upsert({
    where: { key: body.key },
    update: { value: String(body.value), updatedAt: new Date() },
    create: { key: body.key, value: String(body.value) },
  });

  revalidatePath("/");
  revalidateTag("system-settings", "default");
  if (body.key === "homepage_packages") revalidateTag("catalog", "default");
  if (body.key === "catalog_category_order") revalidatePath("/catalogo");

  return ok(updated);
}
