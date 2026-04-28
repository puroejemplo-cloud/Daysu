import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// En App Router el body llega como stream — req.text() lee el raw body sin JSON.parse
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Webhook signature verification failed";
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) return new Response("Missing bookingId in metadata", { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== "pending_payment") {
      return new Response("OK — booking not actionable", { status: 200 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "confirmed", expiresAt: null },
      });
      await tx.adminNotification.create({
        data: {
          bookingId,
          type: "payment_received",
          message: `Pago confirmado vía Stripe (sesión ${session.id}). Reserva '${booking.eventName}' confirmada automáticamente.`,
        },
      });
    });
  }

  return new Response("OK", { status: 200 });
}
