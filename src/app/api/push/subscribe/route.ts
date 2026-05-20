import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const adminUserId = parseInt(session.user.id);
  if (isNaN(adminUserId)) return err("ID de usuario inválido", 400);

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return err("Suscripción incompleta", 400);
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, adminUserId },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, adminUserId },
  });

  return ok({ subscribed: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { endpoint } = await req.json();
  if (!endpoint) return err("Endpoint requerido", 400);

  await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => null);
  return ok({ unsubscribed: true });
}
