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
    eventName?: string; eventDate?: string; setupHour?: string;
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

  const { eventName, eventDate, setupHour, venueAddress, notes, totalAmount, depositAmount, status, client } = body;

  const existing = await prisma.booking.findUnique({
    where:  { id },
    select: { id: true, clientId: true, setupAt: true, teardownAt: true, eventDate: true },
  });
  if (!existing) return err("Reserva no encontrada", 404);

  try {
    // 1 — Actualizar cliente (sin transacción — operaciones independientes)
    if (client) {
      const fullName = client.fullName?.trim();
      const phone    = client.phone !== undefined ? (client.phone?.trim() || null) : undefined;
      if (fullName || phone !== undefined) {
        await prisma.client.update({
          where: { id: existing.clientId },
          data:  {
            ...(fullName           && { fullName }),
            ...(phone !== undefined && { phone }),
          },
        });
      }
    }

    // 2 — Recalcular fechas si se envían
    let setupAt    = existing.setupAt;
    let teardownAt = existing.teardownAt;
    if (eventDate || setupHour) {
      const dateStr = eventDate ?? existing.eventDate.toISOString().split("T")[0];
      const [h, m]  = (setupHour ?? "19:00").split(":").map(Number);
      // Usar mediodía UTC para evitar desfase de zona horaria en campo @db.Date
      const base    = new Date(`${dateStr}T12:00:00.000Z`);
      setupAt    = new Date(base);
      setupAt.setUTCHours(h, m, 0, 0);
      teardownAt = new Date(setupAt);
      teardownAt.setUTCHours(teardownAt.getUTCHours() + 6);
    }

    // 3 — Actualizar booking con tipos explícitos (no Record<string, unknown>)
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(eventName?.trim()       && { eventName:    eventName.trim() }),
        ...(eventDate               && { eventDate:    new Date(`${eventDate}T12:00:00.000Z`) }),
        setupAt,
        teardownAt,
        ...(venueAddress !== undefined && { venueAddress: venueAddress.trim() || null }),
        ...(notes        !== undefined && { notes:        notes.trim()        || null }),
        ...(totalAmount  != null       && { totalAmount:  totalAmount }),
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
