import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

// POST /api/bookings/:id/cancel  → admin fuerza el cierre/cancelación
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return err("Reserva no encontrada", 404);

  if (["completed", "cancelled", "expired"].includes(booking.status)) {
    return err(`La reserva ya está en estado '${booking.status}'`);
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: { status: "cancelled", expiresAt: null },
    });
    await tx.adminNotification.create({
      data: {
        bookingId: id,
        type: "force_cancelled",
        message: `Reserva '${booking.eventName}' cancelada manualmente. Stock liberado.`,
      },
    });
    return updated;
  });

  return ok(cancelled);
}
