import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

// GET /api/cron/expire-holds
// Llamar cada 15-30 min desde un cron job (Vercel Cron, GitHub Actions, etc.)
// En producción proteger con CRON_SECRET en headers.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expired = await prisma.booking.findMany({
    where: { status: "pending_payment", expiresAt: { lt: new Date() } },
    select: { id: true, eventName: true },
  });

  if (expired.length === 0) return ok({ expired: 0 });

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: expired.map((b) => b.id) } },
      data: { status: "expired" },
    }),
    ...expired.map((b) =>
      prisma.adminNotification.create({
        data: {
          bookingId: b.id,
          type: "hold_expired",
          message: `Hold vencido sin pago: reserva '${b.eventName}'. Stock liberado automáticamente.`,
        },
      })
    ),
  ]);

  return ok({ expired: expired.length, bookingIds: expired.map((b) => b.id) });
}
