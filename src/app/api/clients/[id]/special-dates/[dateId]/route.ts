import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

type Params = { params: Promise<{ id: string; dateId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, dateId } = await params;
  const date = await prisma.clientSpecialDate.findUnique({ where: { id: Number(dateId) } });
  if (!date || date.clientId !== Number(id)) return err("Fecha no encontrada", 404);
  await prisma.clientSpecialDate.delete({ where: { id: Number(dateId) } });
  return ok({ message: "Fecha eliminada" });
}
