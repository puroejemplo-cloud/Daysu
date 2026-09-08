import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateChecklist } from "@/lib/checklist";
import { ok, err } from "@/lib/api";
import { ChecklistPhase } from "@/generated/prisma";
import { auth } from "@/auth";
import { getAdminScope, bookingOwnerWhere } from "@/lib/adminScope";

// GET /api/checklists?booking_id=X&phase=salida|entrada
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);
  const scope = getAdminScope(session);

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("booking_id");
  const phase = searchParams.get("phase") as ChecklistPhase | null;

  if (!bookingId) return err("booking_id es requerido");

  const booking = await prisma.booking.findFirst({ where: { id: bookingId, ...bookingOwnerWhere(scope) } });
  if (!booking) return err("Reserva no encontrada", 404);

  if (phase) {
    if (!["salida", "entrada"].includes(phase)) return err("phase debe ser 'salida' o 'entrada'");
    const checklist = await getOrCreateChecklist(bookingId, phase);
    return ok(checklist);
  }

  // Sin phase: devuelve ambas fases
  const [salida, entrada] = await Promise.all([
    getOrCreateChecklist(bookingId, "salida"),
    getOrCreateChecklist(bookingId, "entrada"),
  ]);
  return ok({ salida, entrada });
}
