import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { id } = await params;
  const body = await req.json();

  const rule = await prisma.upsellRule.findUnique({ where: { id: Number(id) } });
  if (!rule) return err("Regla no encontrada", 404);

  const updated = await prisma.upsellRule.update({
    where: { id: Number(id) },
    data: {
      ...(body.discountPercent !== undefined && { discountPercent: Number(body.discountPercent) }),
      ...(body.label !== undefined && { label: body.label?.trim() ?? null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: {
      sourceAsset:    { select: { id: true, name: true } },
      suggestedAsset: { select: { id: true, name: true } },
    },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { id } = await params;
  const rule = await prisma.upsellRule.findUnique({ where: { id: Number(id) } });
  if (!rule) return err("Regla no encontrada", 404);
  await prisma.upsellRule.delete({ where: { id: Number(id) } });
  return ok({ message: "Regla eliminada" });
}
