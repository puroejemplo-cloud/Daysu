import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";
import { ok, err } from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:admin@daysu.vip",
  process.env.VAPID_PUBLIC_KEY  ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

async function sendPushToAdmin(adminUserId: number, payload: object) {
  const subs = await prisma.pushSubscription.findMany({
    where: { adminUserId },
  });
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      )
    )
  );
}

export async function GET(req: NextRequest) {
  // Proteger el endpoint en producción
  const secret = req.headers.get("x-cron-secret");
  if (process.env.NODE_ENV === "production" && secret !== process.env.CRON_SECRET) {
    return err("No autorizado", 401);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7);
  const in1Day  = new Date(today); in1Day.setDate(in1Day.getDate() + 1);

  // Buscar eventos en 7 días y en 1 día
  const targets = await prisma.booking.findMany({
    where: {
      status:    { in: ["confirmed", "in_progress"] },
      eventDate: { in: [in7Days, in1Day] },
    },
    select: {
      id: true, eventName: true, eventDate: true, setupAt: true,
      venueAddress: true,
      client: { select: { fullName: true, phone: true } },
      items: {
        where:   { isAutoBlocked: false },
        select:  { asset: { select: { ownerSuffix: true, ownerAdminId: true } } },
        take: 1,
      },
    },
  });

  let sent = 0;

  for (const booking of targets) {
    const daysUntil = Math.round(
      (booking.eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const timeStr   = format(new Date(booking.setupAt), "HH:mm", { locale: es });
    const dateStr   = format(booking.eventDate, "EEEE d 'de' MMMM", { locale: es });
    const isWeek    = daysUntil === 7;

    const title = isWeek
      ? `Evento en 7 días — ${booking.eventName}`
      : `Evento MAÑANA — ${booking.eventName}`;

    const body = [
      `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} · ${timeStr}h`,
      `Cliente: ${booking.client.fullName}`,
      booking.client.phone ? `Tel: ${booking.client.phone}` : null,
      booking.venueAddress ? `Lugar: ${booking.venueAddress}` : null,
    ].filter(Boolean).join("\n");

    const payload = {
      title,
      body,
      tag:  `event-${booking.id}-${daysUntil}d`,
      url:  `/admin/calendario`,
    };

    // Notificar al admin dueño de los activos del evento
    const ownerAdminId = booking.items[0]?.asset?.ownerAdminId;
    if (ownerAdminId) {
      await sendPushToAdmin(ownerAdminId, payload);
      sent++;
    } else {
      // Sin owner definido → notificar a todos los admins activos
      const admins = await prisma.adminUser.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      await Promise.all(admins.map((a) => sendPushToAdmin(a.id, payload)));
      sent++;
    }
  }

  return ok({ checked: targets.length, sent });
}
