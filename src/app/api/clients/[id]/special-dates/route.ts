import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { getAdminScope, clientOwnerWhere } from "@/lib/adminScope";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const scope = getAdminScope(session);

  const { id } = await params;
  const body = await req.json();
  const { label, month, day, year, notes } = body;

  if (!label?.trim())           return err("El tipo de fecha es requerido");
  if (!month || month < 1 || month > 12) return err("Mes inválido (1-12)");
  if (!day   || day   < 1 || day   > 31) return err("Día inválido (1-31)");

  const client = await prisma.client.findFirst({ where: { id: Number(id), ...clientOwnerWhere(scope) } });
  if (!client) return err("Cliente no encontrado", 404);

  const date = await prisma.clientSpecialDate.create({
    data: {
      clientId: Number(id),
      label:    label.trim(),
      month:    Number(month),
      day:      Number(day),
      year:     year ? Number(year) : null,
      notes:    notes?.trim() ?? null,
    },
  });
  return ok(date, 201);
}
