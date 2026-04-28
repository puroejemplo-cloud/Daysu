import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

// POST /api/bookings/:id/confirm  → pago de apartado recibido, confirmar reserva
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return err("Reserva no encontrada", 404);

  if (booking.status !== "pending_payment") {
    return err(`No se puede confirmar una reserva en estado '${booking.status}'`);
  }

  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await prisma.booking.update({ where: { id }, data: { status: "expired" } });
    return err("El período de pago ha vencido. La reserva fue liberada automáticamente.", 410);
  }

  const confirmed = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: { status: "confirmed", expiresAt: null },
      include: { client: true, items: true },
    });
    await tx.adminNotification.create({
      data: {
        bookingId: id,
        type: "payment_received",
        message: `Pago de apartado confirmado para la reserva de '${updated.eventName}' (${updated.client.fullName}).`,
      },
    });
    return updated;
  });

  return ok(confirmed);
}
