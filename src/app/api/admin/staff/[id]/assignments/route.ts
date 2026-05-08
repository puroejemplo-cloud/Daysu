import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

// POST /api/admin/staff/[id]/assignments — asignar activo a colaborador
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { id } = await params;
  const staffId = parseInt(id);
  if (isNaN(staffId)) return err("ID inválido");

  const { assetId } = await req.json().catch(() => ({}));
  if (!assetId) return err("assetId requerido");

  const asset = await prisma.asset.findFirst({ where: { id: assetId, isActive: true } });
  if (!asset) return err("Activo no encontrado", 404);

  const assignment = await prisma.staffAssetAssignment.upsert({
    where:  { staffId_assetId: { staffId, assetId } },
    create: { staffId, assetId },
    update: {},
  });
  return ok(assignment, 201);
}

// DELETE /api/admin/staff/[id]/assignments?assetId=N — remover asignación
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { id } = await params;
  const staffId = parseInt(id);
  const assetId = parseInt(new URL(req.url).searchParams.get("assetId") ?? "");
  if (isNaN(staffId) || isNaN(assetId)) return err("IDs inválidos");

  await prisma.staffAssetAssignment.deleteMany({ where: { staffId, assetId } });
  return ok({ staffId, assetId });
}
