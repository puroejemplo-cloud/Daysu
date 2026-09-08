import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { getAdminScope, clientOwnerWhere, bookingOwnerWhere } from "@/lib/adminScope";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const scope = getAdminScope(session);

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id: Number(id), ...clientOwnerWhere(scope) },
    include: {
      specialDates: { orderBy: [{ month: "asc" }, { day: "asc" }] },
      bookings: {
        where: bookingOwnerWhere(scope),
        include: {
          items: {
            where: { isAutoBlocked: false },
            include: { asset: { select: { name: true } } },
          },
        },
        orderBy: { setupAt: "desc" },
      },
    },
  });
  if (!client) return err("Cliente no encontrado", 404);
  return ok(client);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const scope = getAdminScope(session);

  const { id } = await params;
  const body = await req.json();
  const { fullName, phone, company, taxId, crmNotes, preferencias, referredBy } = body;

  const client = await prisma.client.findFirst({ where: { id: Number(id), ...clientOwnerWhere(scope) } });
  if (!client) return err("Cliente no encontrado", 404);

  const updated = await prisma.client.update({
    where: { id: Number(id) },
    data: {
      ...(fullName     !== undefined && { fullName:     fullName.trim() }),
      ...(phone        !== undefined && { phone:        phone?.trim() ?? null }),
      ...(company      !== undefined && { company:      company?.trim() ?? null }),
      ...(taxId        !== undefined && { taxId:        taxId?.trim() ?? null }),
      ...(crmNotes     !== undefined && { crmNotes:     crmNotes?.trim() ?? null }),
      ...(preferencias !== undefined && { preferencias: preferencias?.trim() ?? null }),
      ...(referredBy   !== undefined && { referredBy:   referredBy?.trim() ?? null }),
    },
    include: { specialDates: true },
  });
  return ok(updated);
}
