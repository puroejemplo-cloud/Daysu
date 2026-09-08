import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { getAdminScope, bookingOwnerWhere } from "@/lib/adminScope";

type Params = { params: Promise<{ id: string; itemId: string }> };

// PATCH /api/checklists/:id/items/:itemId  → toggle checked
export async function PATCH(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);
  const scope = getAdminScope(session);

  const { id, itemId } = await params;

  const item = await prisma.checklistItem.findFirst({
    where: { id: Number(itemId), checklist: { booking: bookingOwnerWhere(scope) } },
  });
  if (!item) return err("Ítem no encontrado", 404);
  if (item.checklistId !== Number(id)) return err("El ítem no pertenece a este checklist", 400);

  const updated = await prisma.checklistItem.update({
    where: { id: Number(itemId) },
    data: {
      checked:   !item.checked,
      checkedAt: !item.checked ? new Date() : null,
    },
  });
  return ok(updated);
}
