import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { expandBomItems } from "@/lib/bookings";

// GET — lista reservas para el panel admin
// Sin ?status → activas (excluye cancelled/expired)
// ?status=cancelled|expired|confirmed|... → filtro específico
// ?status=all → todas sin excepción
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const isSuperAdmin = session.user.role === "superadmin";
  const suffix       = session.user.suffix as string | undefined;

  // Filtro de estado
  const statusFilter =
    status === "all"
      ? {}
      : status
      ? { status: status as never }
      : { status: { notIn: ["cancelled", "expired"] as never[] } };

  // Filtro por propiedad: admin solo ve eventos con al menos un producto suyo
  const ownerFilter = isSuperAdmin || !suffix
    ? {}
    : { items: { some: { isAutoBlocked: false, asset: { ownerSuffix: suffix } } } };

  const where = { ...statusFilter, ...ownerFilter };

  const bookings = await prisma.booking.findMany({
    where,
    select: {
      id: true, eventName: true, status: true,
      eventDate: true, setupAt: true, expiresAt: true,
      venueAddress: true,
      totalAmount: true, depositAmount: true,
      client: { select: { fullName: true, email: true, phone: true } },
      // Solo las notificaciones sin leer — eficiente y exacto
      notifications: {
        where:  { isRead: false },
        select: { id: true },
      },
    },
    orderBy: { eventDate: "asc" },
  });

  return ok(bookings);
}

// POST — admin registra una venta manual → booking confirmado directo (sin Stripe)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const body = await req.json();
  const { client, eventName, eventDate, setupAt, teardownAt, venueAddress, items, notes, totalAmount, depositAmount } = body;

  if (!eventName?.trim())  return err("Nombre del evento requerido");
  if (!setupAt || !teardownAt) return err("Fechas del evento requeridas");
  if (!Array.isArray(items) || items.length === 0) return err("Selecciona al menos un artículo");

  const start = new Date(setupAt);
  const end   = new Date(teardownAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return err("Fechas inválidas");
  if (start >= end) return err("La hora de inicio debe ser anterior al fin");

  try {
    const expandedItems = await expandBomItems(items);
    const total   = totalAmount
      ? Number(totalAmount)
      : expandedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const deposit = depositAmount != null ? Number(depositAmount) : 0;

    const clientEmail    = client?.email?.toLowerCase().trim() || null;
    const clientFullName = client?.fullName?.trim() || "Cliente";
    const clientPhone    = client?.phone?.trim() || null;

    const booking = await prisma.$transaction(async (tx) => {
      let dbClient;

      if (clientEmail) {
        dbClient = await tx.client.upsert({
          where:  { email: clientEmail },
          update: { fullName: clientFullName, phone: clientPhone ?? undefined },
          create: { email: clientEmail, fullName: clientFullName, phone: clientPhone },
        });
      } else {
        // Sin email — placeholder único para mantener la restricción unique
        const placeholder = `sin-email-${Date.now()}@aura.local`;
        dbClient = await tx.client.create({
          data: { email: placeholder, fullName: clientFullName, phone: clientPhone },
        });
      }

      return tx.booking.create({
        data: {
          clientId:      dbClient.id,
          eventName:     eventName.trim(),
          eventDate:     new Date(eventDate ?? setupAt),
          setupAt:       start,
          teardownAt:    end,
          venueAddress:  venueAddress?.trim() ?? null,
          status:        "confirmed",
          totalAmount:   total,
          depositAmount: deposit,
          expiresAt:     null,
          notes:         notes?.trim() ?? null,
          items: {
            create: expandedItems.map((item, idx) => ({
              assetId:             item.assetId,
              quantity:            item.quantity,
              unitPrice:           item.overridePrice ?? item.unitPrice,
              isAutoBlocked:       item.isAutoBlocked,
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
