import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ok, err } from "@/lib/api";

type Params = { params: Promise<{ bookingId: string }> };

// POST /api/checkout/:bookingId  → crea sesión de Stripe Checkout para el apartado
export async function POST(_req: NextRequest, { params }: Params) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { client: true },
  });

  if (!booking) return err("Reserva no encontrada", 404);
  if (booking.status !== "pending_payment") {
    return err(`La reserva está en estado '${booking.status}' y no acepta pagos`);
  }
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    return err("El período de pago ha vencido", 410);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const depositCents = Math.round(Number(booking.depositAmount) * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.client.email,
    line_items: [
      {
        price_data: {
          currency: "mxn",
          unit_amount: depositCents,
          product_data: {
            name: `Apartado — ${booking.eventName}`,
            description: `Reserva #${booking.id.slice(0, 8).toUpperCase()} · 30% del total`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${baseUrl}/reserva/${booking.id}?paid=1`,
    cancel_url:  `${baseUrl}/reserva/${booking.id}?cancelled=1`,
    expires_at: booking.expiresAt
      ? Math.floor(booking.expiresAt.getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 60, // 30 min si no hay expiresAt
  });

  // Guardar el session ID para poder identificar el pago en el webhook
  await prisma.booking.update({
    where: { id: bookingId },
    data: { stripeSessionId: session.id },
  });

  return ok({ url: session.url });
}
