import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { getAdminScope, clientOwnerWhere } from "@/lib/adminScope";

type Params = { params: Promise<{ id: string; dateId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const scope = getAdminScope(session);

  const { id, dateId } = await params;
  const date = await prisma.clientSpecialDate.findFirst({
    where: { id: Number(dateId), client: clientOwnerWhere(scope) },
  });
  if (!date || date.clientId !== Number(id)) return err("Fecha no encontrada", 404);
  await prisma.clientSpecialDate.delete({ where: { id: Number(dateId) } });
  return ok({ message: "Fecha eliminada" });
}
