import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { revalidateTag } from "next/cache";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id: Number(id) },
    include: {
      category:   true,
      ownerAdmin: { select: { suffix: true, fullName: true } },
      components: {
        include: {
          childAsset: {
            select: { id: true, name: true, dailyRate: true, ownerSuffix: true },
          },
        },
      },
    },
  });
  if (!asset) return err("Activo no encontrado", 404);

  // Calcular precio sumado de componentes usando el precio del hijo (componente)
  const componentTotal = asset.components.reduce(
    (sum, c) => sum + Number(c.childAsset.dailyRate) * c.quantity,
    0
  );
  const savings        = componentTotal - Number(asset.dailyRate);
  const savingsPct     = componentTotal > 0 ? Math.round((savings / componentTotal) * 100) : 0;

  return ok({
    ...asset,
    displayName:    asset.ownerSuffix ? `${asset.name} [${asset.ownerSuffix}]` : asset.name,
    componentTotal,
    savings:        Math.max(0, savings),
    savingsPct:     Math.max(0, savingsPct),
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const { id } = await params;

  const asset = await prisma.asset.findUnique({ where: { id: Number(id) } });
  if (!asset) return err("Activo no encontrado", 404);

  const isSuperAdmin = session.user.role === "superadmin";
  const isOwner      = asset.ownerAdminId === Number(session.user.id);
  if (!isSuperAdmin && !isOwner) return err("Solo el propietario puede eliminar este activo", 403);

  await prisma.asset.update({ where: { id: Number(id) }, data: { isActive: false } });
  revalidateTag("catalog", "default");
  return ok({ message: "Activo eliminado correctamente" });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return err("No autenticado", 401);
    const { id } = await params;

    const asset = await prisma.asset.findUnique({ where: { id: Number(id) } });
    if (!asset) return err("Activo no encontrado", 404);

    const body = await req.json();
    const { name, sku, description, totalUnits, dailyRate, originalPrice, maxGuests, isRentable, isActive, categoryId, pricingTiers, imageUrl, imageGallery, assetType, isRecommended, promoType, promoMinValue } = body;

    const isSuperAdmin = session.user.role === "superadmin";
    const isOwner      = asset.ownerAdminId === Number(session.user.id);
    if (!isSuperAdmin && !isOwner) return err("Solo el propietario puede editar este activo", 403);

    if (sku && sku !== asset.sku) {
      const conflict = await prisma.asset.findUnique({ where: { sku: sku.trim() } });
      if (conflict) return err(`El SKU '${sku}' ya existe`, 409);
    }

    const updated = await prisma.asset.update({
      where: { id: Number(id) },
      data: {
        ...(name          !== undefined && { name:          name.trim() }),
        ...(sku           !== undefined && { sku:           sku.trim().toUpperCase() }),
        ...(description   !== undefined && { description:   description?.trim() ?? null }),
        ...(totalUnits    !== undefined && { totalUnits:    Number(totalUnits) }),
        ...(dailyRate     !== undefined && { dailyRate:     Number(dailyRate) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice !== null ? Number(originalPrice) : null }),
        ...(maxGuests     !== undefined && { maxGuests:     maxGuests     !== null ? Number(maxGuests)     : null }),
        // assetType determina isRentable: component → false, package/product → true
        ...(assetType !== undefined && {
          assetType,
          isRentable: assetType !== "component",
        }),
        ...(assetType === undefined && isRentable !== undefined && { isRentable }),
        ...(isActive      !== undefined && { isActive }),
        ...(categoryId    !== undefined && { categoryId:    Number(categoryId) }),
        ...(pricingTiers  !== undefined && { pricingTiers:  pricingTiers ?? null }),
        ...(imageUrl        !== undefined && { imageUrl:        imageUrl ?? null }),
        ...(imageGallery    !== undefined && { imageGallery:    Array.isArray(imageGallery) ? imageGallery : [] }),
        ...(isRecommended   !== undefined && { isRecommended }),
        ...(promoType       !== undefined && { promoType:       promoType ?? null }),
        ...(promoMinValue   !== undefined && { promoMinValue:   promoMinValue !== null ? Number(promoMinValue) : null }),
      },
      include: {
        category:   true,
        ownerAdmin: { select: { suffix: true } },
      },
    });

    revalidateTag("catalog", "default");
    return ok({ ...updated, displayName: updated.ownerSuffix ? `${updated.name} [${updated.ownerSuffix}]` : updated.name });
  } catch (e: unknown) {
    console.error("PATCH /api/admin/assets/[id] error:", e);
    return err(e instanceof Error ? e.message : "Error interno del servidor", 500);
  }
}
