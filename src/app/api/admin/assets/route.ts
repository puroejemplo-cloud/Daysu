import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { revalidateTag, revalidatePath } from "next/cache";

// GET  — todos los activos con info de propietario
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const rentable = new URL(req.url).searchParams.get("rentable");

  const assets = await prisma.asset.findMany({
    where: {
      isActive: true,
      ...(rentable === "true"  ? { isRentable: true }  : {}),
      ...(rentable === "false" ? { isRentable: false } : {}),
    },
    include: {
      category:   true,
      ownerAdmin: { select: { suffix: true, fullName: true } },
      components: { include: { childAsset: { select: { id: true, name: true, dailyRate: true, ownerSuffix: true } } } },
    },
    orderBy: [{ ownerSuffix: "asc" }, { name: "asc" }],
  });

  return ok(assets.map((a) => ({
    ...a,
    displayName: a.ownerSuffix ? `${a.name} [${a.ownerSuffix}]` : a.name,
  })));
}

// POST — crear activo/paquete, asigna ownership al admin logueado
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const body = await req.json();
  const { categoryId, name, sku, description, totalUnits, dailyRate, isRentable, assetType } = body;

  if (!name?.trim()) return err("El nombre es requerido");
  if (!sku?.trim())  return err("El SKU es requerido");
  if (!categoryId)   return err("La categoría es requerida");
  if (!totalUnits || totalUnits < 1)  return err("Unidades debe ser > 0");
  if (dailyRate == null || dailyRate < 0) return err("Tarifa requerida");

  const existing = await prisma.asset.findUnique({ where: { sku: sku.trim() } });
  if (existing) return err(`El SKU '${sku}' ya existe`, 409);

  const adminId  = Number(session.user.id);
  const admin    = await prisma.adminUser.findUnique({ where: { id: adminId }, select: { suffix: true } });

  const asset = await prisma.asset.create({
    data: {
      categoryId:   Number(categoryId),
      name:         name.trim(),
      sku:          sku.trim().toUpperCase(),
      description:  description?.trim() ?? null,
      totalUnits:   Number(totalUnits),
      dailyRate:    Number(dailyRate),
      assetType:    assetType ?? (isRentable === false ? "component" : "product"),
      isRentable:   assetType ? assetType !== "component" : (isRentable ?? true),
      ownerAdminId: adminId,
      ownerSuffix:  admin?.suffix ?? null,
    },
    include: { category: true, ownerAdmin: { select: { suffix: true } } },
  });

  revalidateTag("catalog", "default");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return ok({ ...asset, displayName: `${asset.name} [${admin?.suffix}]` }, 201);
}
