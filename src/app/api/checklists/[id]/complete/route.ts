import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { getAdminScope, bookingOwnerWhere } from "@/lib/adminScope";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/checklists/:id/complete  → marcar fase como completada + guardar notas
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);
  const scope = getAdminScope(session);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const checklist = await prisma.eventChecklist.findFirst({
    where: { id: Number(id), booking: bookingOwnerWhere(scope) },
    include: { items: true },
  });
  if (!checklist) return err("Checklist no encontrado", 404);

  const unchecked = checklist.items.filter((i) => !i.checked).length;
  if (unchecked > 0) {
    return err(`Quedan ${unchecked} ítem(s) sin marcar. ¿Deseas completar de todas formas?`, 422);
  }

  const updated = await prisma.eventChecklist.update({
    where: { id: Number(id) },
    data: {
      completedAt: new Date(),
      notes: body.notes?.trim() ?? checklist.notes,
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  return ok(updated);
}

// Forzar completar aunque haya ítems sin marcar
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);
  const scope = getAdminScope(session);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const checklist = await prisma.eventChecklist.findFirst({
    where: { id: Number(id), booking: bookingOwnerWhere(scope) },
  });
  if (!checklist) return err("Checklist no encontrado", 404);

  const updated = await prisma.eventChecklist.update({
    where: { id: Number(id) },
    data: {
      completedAt: new Date(),
      notes: body.notes?.trim() ?? checklist.notes,
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  return ok(updated);
}
