import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { expandBomItems, getHoldHours, assertAvailability } from "@/lib/bookings";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const bookings = await prisma.booking.findMany({
    where: { ...(status ? { status: status as never } : {}) },
    include: {
      client: true,
      items: { include: { asset: { select: { id: true, name: true, sku: true } } } },
      notifications: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(bookings);
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 10); // 10 reservas/min por IP
  if (limited) return limited;

  const body = await req.json();
  const { client, eventName, eventDate, setupAt, teardownAt, venueAddress, items, notes } = body;

  // ── Validaciones básicas ──────────────────────────────────────────────────
  if (!client?.fullName || !client?.email) return err("Nombre y email del cliente son requeridos");
  if (!eventName?.trim()) return err("El nombre del evento es requerido");
  if (!setupAt || !teardownAt) return err("setup_at y teardown_at son requeridos");
  if (!Array.isArray(items) || items.length === 0) return err("Debe incluir al menos un artículo");

  const start = new Date(setupAt);
  const end = new Date(teardownAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return err("Fechas inválidas");
  if (start >= end) return err("setup_at debe ser anterior a teardown_at");

  try {
    // ── Verificar disponibilidad antes de abrir transacción ───────────────
    await assertAvailability(items, start, end);

    // ── Expandir BOM ─────────────────────────────────────────────────────
    const expandedItems = await expandBomItems(items);

    const holdHours = await getHoldHours();
    const expiresAt = new Date(Date.now() + holdHours * 60 * 60 * 1000);

    const totalAmount = expandedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const depositAmount = totalAmount * 0.3; // 30% de anticipo por defecto

    // ── Crear cliente si no existe, reserva e ítems en una transacción ───
    const booking = await prisma.$transaction(async (tx) => {
      // Upsert cliente por email
      const dbClient = await tx.client.upsert({
        where: { email: client.email.toLowerCase().trim() },
        update: {
          fullName: client.fullName.trim(),
          phone: client.phone?.trim() ?? undefined,
          company: client.company?.trim() ?? undefined,
        },
        create: {
          email: client.email.toLowerCase().trim(),
          fullName: client.fullName.trim(),
          phone: client.phone?.trim() ?? null,
          company: client.company?.trim() ?? null,
          taxId: client.taxId?.trim() ?? null,
        },
      });

      // Doble verificación de disponibilidad dentro de la transacción (lock optimista)
      await assertAvailability(items, start, end);

      const newBooking = await tx.booking.create({
        data: {
          clientId: dbClient.id,
          eventName: eventName.trim(),
          eventDate: new Date(eventDate),
          setupAt: start,
          teardownAt: end,
          venueAddress: venueAddress?.trim() ?? null,
          status: "pending_payment",
          totalAmount,
          depositAmount,
          expiresAt,
          notes: notes?.trim() ?? null,
          items: {
            create: expandedItems.map((item, idx) => ({
              assetId: item.assetId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              isAutoBlocked: item.isAutoBlocked,
              parentBookingItemId: item.parentIndex !== null ? idx - 1 : null,
            })),
          },
          notifications: {
            create: {
              type: "hold_created",
              message: `Nueva solicitud de reserva para '${eventName}' — vence en ${holdHours}h. Pendiente de pago de apartado.`,
            },
          },
        },
        include: {
          client: true,
          items: { include: { asset: { select: { id: true, name: true } } } },
        },
      });

      return newBooking;
    });

    return ok(
      {
        booking,
        message: `Reserva creada. Tienes ${holdHours} horas para realizar el pago del apartado.`,
        expiresAt,
      },
      201
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error al crear la reserva";
    return err(message, 409);
  }
}
