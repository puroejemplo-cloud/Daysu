import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { expandBomItems } from "@/lib/bookings";

// POST — admin registra una venta manual → crea booking confirmado directamente
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const body = await req.json();
  const { client, eventName, eventDate, setupAt, teardownAt, venueAddress, items, notes, totalAmount } = body;

  if (!client?.fullName || !client?.email) return err("Nombre y email del cliente son requeridos");
  if (!eventName?.trim())  return err("Nombre del evento requerido");
  if (!setupAt || !teardownAt) return err("Fechas del evento requeridas");
  if (!Array.isArray(items) || items.length === 0) return err("Selecciona al menos un artículo");

  const start = new Date(setupAt);
  const end   = new Date(teardownAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return err("Fechas inválidas");
  if (start >= end) return err("La hora de inicio debe ser anterior al fin");

  try {
    const expandedItems = await expandBomItems(items);
    const total = totalAmount
      ? Number(totalAmount)
      : expandedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const booking = await prisma.$transaction(async (tx) => {
      const dbClient = await tx.client.upsert({
        where:  { email: client.email.toLowerCase().trim() },
        update: { fullName: client.fullName.trim(), phone: client.phone?.trim() ?? undefined },
        create: { email: client.email.toLowerCase().trim(), fullName: client.fullName.trim(), phone: client.phone?.trim() ?? null },
      });

      return tx.booking.create({
        data: {
          clientId:     dbClient.id,
          eventName:    eventName.trim(),
          eventDate:    new Date(eventDate ?? setupAt),
          setupAt:      start,
          teardownAt:   end,
          venueAddress: venueAddress?.trim() ?? null,
          status:       "confirmed",      // venta directa → confirmada de inmediato
          totalAmount:  total,
          depositAmount: total,           // pago total al contado
          expiresAt:    null,
          notes:        notes?.trim() ?? null,
          items: {
            create: expandedItems.map((item, idx) => ({
              assetId:            item.assetId,
              quantity:           item.quantity,
              unitPrice:          item.overridePrice ?? item.unitPrice,
              isAutoBlocked:      item.isAutoBlocked,
              parentBookingItemId: item.parentIndex !== null ? idx - 1 : null,
            })),
          },
          notifications: {
            create: {
              type:    "payment_received",
              message: `Venta manual registrada por ${session.user?.name} — '${eventName}'.`,
            },
          },
        },
        include: { client: true, items: { include: { asset: { select: { name: true } } } } },
      });
    });

    return ok({ booking, message: "Venta registrada y productos bloqueados para esa fecha." }, 201);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : "Error al registrar la venta", 409);
  }
}
