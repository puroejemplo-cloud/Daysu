import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { BookingStatus } from "@/generated/prisma";

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

  let body: {
    eventName?: string; eventDate?: string;
    setupAt?: string; teardownAt?: string;   // ISO strings calculados en el cliente
    venueAddress?: string; notes?: string;
    totalAmount?: number; depositAmount?: number;
    status?: string;
    client?: { fullName?: string; phone?: string };
  };
  try {
    body = await req.json();
  } catch {
    return err("Body inválido", 400);
  }

  const { eventName, eventDate, setupAt: setupAtStr, teardownAt: teardownAtStr,
          venueAddress, notes, totalAmount, depositAmount, status, client } = body;

  const existing = await prisma.booking.findUnique({
    where:  { id },
    select: { id: true, clientId: true, setupAt: true, teardownAt: true, eventDate: true },
  });
  if (!existing) return err("Reserva no encontrada", 404);

  try {
    // 1 — Actualizar cliente
    if (client) {
      const fullName = client.fullName?.trim();
      const phone    = client.phone !== undefined ? (client.phone.trim() || null) : undefined;
      if (fullName || phone !== undefined) {
        await prisma.client.update({
          where: { id: existing.clientId },
          data: {
            ...(fullName           && { fullName }),
            ...(phone !== undefined && { phone }),
          },
        });
      }
    }

    // 2 — Usar setupAt/teardownAt ISO del cliente (ya en UTC correcto para la zona horaria local)
    const setupAt    = setupAtStr    ? new Date(setupAtStr)    : existing.setupAt;
    const teardownAt = teardownAtStr ? new Date(teardownAtStr) : existing.teardownAt;

    // 3 — Actualizar booking con tipos explícitos
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(eventName?.trim() && { eventName: eventName.trim() }),
        ...(eventDate && { eventDate: new Date(`${eventDate}T12:00:00.000Z`) }),
        setupAt,
        teardownAt,
        ...(venueAddress !== undefined && { venueAddress: venueAddress.trim() || null }),
        ...(notes        !== undefined && { notes:        notes.trim()        || null }),
        ...(totalAmount  != null       && { totalAmount }),
        ...(depositAmount != null      && { depositAmount }),
        ...(status && Object.values(BookingStatus).includes(status as BookingStatus) && {
          status: status as BookingStatus,
        }),
      },
      include: {
        client: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    return ok({ booking: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    console.error(`PUT /api/admin/bookings/${id}:`, msg);
    return err(msg, 500);
  }
}
