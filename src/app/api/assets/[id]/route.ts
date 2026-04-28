import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id: Number(id) },
    include: {
      category: true,
      components: { include: { childAsset: { select: { id: true, name: true } } } },
      staffAssignments: { include: { staff: true } },
    },
  });
  if (!asset) return err("Activo no encontrado", 404);
  return ok(asset);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { categoryId, name, sku, description, totalUnits, dailyRate, isRentable, isActive } = body;

  const existing = await prisma.asset.findUnique({ where: { id: Number(id) } });
  if (!existing) return err("Activo no encontrado", 404);

  if (sku && sku !== existing.sku) {
    const skuConflict = await prisma.asset.findUnique({ where: { sku: sku.trim() } });
    if (skuConflict) return err(`El SKU '${sku}' ya está en uso`, 409);
  }

  const updated = await prisma.asset.update({
    where: { id: Number(id) },
    data: {
      ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
      ...(name !== undefined && { name: name.trim() }),
      ...(sku !== undefined && { sku: sku.trim().toUpperCase() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(totalUnits !== undefined && { totalUnits: Number(totalUnits) }),
      ...(dailyRate !== undefined && { dailyRate: Number(dailyRate) }),
      ...(isRentable !== undefined && { isRentable }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { category: true },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.asset.findUnique({ where: { id: Number(id) } });
  if (!existing) return err("Activo no encontrado", 404);

  // Baja lógica: nunca se eliminan físicamente los activos
  await prisma.asset.update({ where: { id: Number(id) }, data: { isActive: false } });
  return ok({ message: "Activo desactivado correctamente" });
}
