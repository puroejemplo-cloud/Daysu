import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

// GET — detalle completo de una reserva (para el modal de edición)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, fullName: true, email: true, phone: true } },
      items: {
        where:   { isAutoBlocked: false },
        include: { asset: { select: { id: true, name: true } } },
      },
    },
  });

  if (!booking) return err("Reserva no encontrada", 404);
  return ok({ booking });
}

// PUT — edita campos de una reserva existente y los datos del cliente
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { id } = await params;
  const body = await req.json();
  const { eventName, eventDate, setupHour, venueAddress, notes, totalAmount, depositAmount, status, client } = body;

  const existing = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, clientId: true, setupAt: true, teardownAt: true, eventDate: true },
  });
  if (!existing) return err("Reserva no encontrada", 404);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar cliente si se envían campos
      if (client) {
        const clientData: Record<string, string | null> = {};
        if (client.fullName?.trim()) clientData.fullName = client.fullName.trim();
        if (client.phone !== undefined) clientData.phone = client.phone?.trim() || null;
        if (Object.keys(clientData).length > 0) {
          await tx.client.update({ where: { id: existing.clientId }, data: clientData });
        }
      }

      // Recalcular fechas si cambia eventDate o setupHour
      let setupAt    = existing.setupAt;
      let teardownAt = existing.teardownAt;
      if (eventDate || setupHour) {
        const dateStr = eventDate
          ?? existing.eventDate.toISOString().split("T")[0];
        const [h, m] = (setupHour ?? "19:00").split(":").map(Number);
        setupAt    = new Date(`${dateStr}T00:00:00`);
        setupAt.setHours(h, m, 0, 0);
        teardownAt = new Date(setupAt);
        teardownAt.setHours(teardownAt.getHours() + 6);
      }

      const bookingData: Record<string, unknown> = {
        setupAt,
        teardownAt,
      };
      if (eventName?.trim())       bookingData.eventName    = eventName.trim();
      if (eventDate)               bookingData.eventDate    = new Date(eventDate);
      if (venueAddress !== undefined) bookingData.venueAddress = venueAddress?.trim() || null;
      if (notes !== undefined)     bookingData.notes        = notes?.trim() || null;
      if (totalAmount  != null)    bookingData.totalAmount  = Number(totalAmount);
      if (depositAmount != null)   bookingData.depositAmount = Number(depositAmount);
      if (status)                  bookingData.status       = status;

      return tx.booking.update({
        where: { id },
        data:  bookingData,
        include: { client: { select: { id: true, fullName: true, email: true, phone: true } } },
      });
    });

    return ok({ booking: updated });
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : "Error al actualizar", 500);
  }
}
