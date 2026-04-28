import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

// GET — componentes del activo padre
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const { id } = await params;

  const components = await prisma.assetComponent.findMany({
    where: { parentAssetId: Number(id) },
    include: { parentAsset: { select: { id: true, name: true, ownerSuffix: true } } },
  });
  return ok(components);
}

// POST — agregar componente al BOM
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const { id } = await params;
  const body = await req.json();
  const { childAssetId, quantity, isRequired, overridePrice } = body;

  if (!childAssetId) return err("childAssetId es requerido");
  if (!quantity || quantity < 1) return err("Cantidad debe ser > 0");
  if (Number(id) === Number(childAssetId)) return err("Un activo no puede ser componente de sí mismo");

  const [parent, child] = await Promise.all([
    prisma.asset.findUnique({ where: { id: Number(id) } }),
    prisma.asset.findUnique({ where: { id: Number(childAssetId) } }),
  ]);
  if (!parent) return err("Activo padre no encontrado", 404);
  if (!child)  return err("Activo hijo no encontrado", 404);
  if (!parent.isRentable) return err("El padre debe ser rentable");

  const comp = await prisma.assetComponent.create({
    data: {
      parentAssetId: Number(id),
      childAssetId:  Number(childAssetId),
      quantity:      Number(quantity),
      isRequired:    isRequired ?? true,
      ...(overridePrice != null && { overridePrice: Number(overridePrice) }),
    },
  });
  return ok(comp, 201);
}

// DELETE — quitar componente del BOM
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const { id } = await params;
  const { childAssetId } = await req.json();

  const comp = await prisma.assetComponent.findUnique({
    where: { parentAssetId_childAssetId: { parentAssetId: Number(id), childAssetId: Number(childAssetId) } },
  });
  if (!comp) return err("Componente no encontrado en el BOM", 404);

  await prisma.assetComponent.delete({
    where: { parentAssetId_childAssetId: { parentAssetId: Number(id), childAssetId: Number(childAssetId) } },
  });
  return ok({ message: "Componente eliminado del BOM" });
}
