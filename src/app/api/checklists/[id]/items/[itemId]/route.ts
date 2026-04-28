import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

type Params = { params: Promise<{ id: string; itemId: string }> };

// PATCH /api/checklists/:id/items/:itemId  → toggle checked
export async function PATCH(_req: NextRequest, { params }: Params) {
  const { id, itemId } = await params;

  const item = await prisma.checklistItem.findUnique({
    where: { id: Number(itemId) },
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
