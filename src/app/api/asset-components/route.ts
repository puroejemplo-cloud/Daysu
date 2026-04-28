import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// GET /api/asset-components?parent_id=X  → componentes de un activo padre
export async function GET(req: NextRequest) {
  const parentId = new URL(req.url).searchParams.get("parent_id");
  if (!parentId) return err("parent_id es requerido");

  const components = await prisma.assetComponent.findMany({
    where: { parentAssetId: Number(parentId) },
    include: { parentAsset: { select: { id: true, name: true, sku: true } } },
  });
  return ok(components);
}

// POST /api/asset-components  → agrega un componente al BOM de un padre
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { parentAssetId, childAssetId, quantity, isRequired } = body;

  if (!parentAssetId || !childAssetId) return err("parentAssetId y childAssetId son requeridos");
  if (parentAssetId === childAssetId) return err("Un activo no puede ser componente de sí mismo");
  if (!quantity || quantity < 1) return err("La cantidad debe ser mayor a 0");

  const [parent, child] = await Promise.all([
    prisma.asset.findUnique({ where: { id: Number(parentAssetId) } }),
    prisma.asset.findUnique({ where: { id: Number(childAssetId) } }),
  ]);

  if (!parent) return err("Activo padre no encontrado", 404);
  if (!child) return err("Activo hijo no encontrado", 404);
  if (!parent.isRentable) return err("El padre debe ser un activo rentable");
  if (child.isRentable) return err("El componente hijo no puede ser rentable directamente — debe ser un componente interno");

  const component = await prisma.assetComponent.create({
    data: {
      parentAssetId: Number(parentAssetId),
      childAssetId: Number(childAssetId),
      quantity: Number(quantity),
      isRequired: isRequired ?? true,
    },
  });
  return ok(component, 201);
}

// DELETE /api/asset-components  → elimina un componente del BOM
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { parentAssetId, childAssetId } = body;

  if (!parentAssetId || !childAssetId) return err("parentAssetId y childAssetId son requeridos");

  const existing = await prisma.assetComponent.findUnique({
    where: { parentAssetId_childAssetId: { parentAssetId: Number(parentAssetId), childAssetId: Number(childAssetId) } },
  });
  if (!existing) return err("Componente no encontrado en el BOM", 404);

  await prisma.assetComponent.delete({
    where: { parentAssetId_childAssetId: { parentAssetId: Number(parentAssetId), childAssetId: Number(childAssetId) } },
  });
  return ok({ message: "Componente eliminado del BOM" });
}
