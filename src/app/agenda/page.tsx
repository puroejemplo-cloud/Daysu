import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgendaWidget from "@/components/admin/AgendaWidget";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda · Daysu",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Agenda" },
};

export default async function AgendaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const todayStart   = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const isSuperAdmin = session.user.role === "superadmin";
  const suffix       = session.user.suffix as string | undefined;
  const ownerFilter  = isSuperAdmin || !suffix
    ? {}
    : { items: { some: { isAutoBlocked: false, asset: { ownerSuffix: suffix } } } };

  const [upcoming, pending] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status:    { in: ["confirmed", "in_progress"] },
        eventDate: { gte: todayStart },
        ...ownerFilter,
      },
      select: {
        id: true, eventName: true, eventDate: true, setupAt: true, status: true,
        totalAmount: true, depositAmount: true,
        client: { select: { fullName: true, phone: true } },
        items: {
          where:  { isAutoBlocked: false },
          select: { quantity: true, asset: { select: { name: true } } },
          take: 4,
        },
      },
      orderBy: [{ eventDate: "asc" }, { setupAt: "asc" }],
      take: 30,
    }),
    prisma.booking.findMany({
      where: { status: "pending_payment", ...ownerFilter },
      select: {
        id: true, eventName: true, eventDate: true, expiresAt: true,
        totalAmount: true, depositAmount: true,
        client: { select: { fullName: true, phone: true } },
      },
      orderBy: { expiresAt: "asc" },
    }),
  ]);

  return (
    <AgendaWidget
      upcoming={upcoming.map((b) => ({
        id:           b.id,
        eventName:    b.eventName,
        eventDate:    b.eventDate.toISOString(),
        setupAt:      b.setupAt.toISOString(),
        status:       b.status,
        clientName:   b.client.fullName,
        clientPhone:  b.client.phone ?? null,
        totalAmount:  b.totalAmount.toString(),
        depositAmount: b.depositAmount.toString(),
        items:        b.items.map((i) => ({ name: i.asset.name, quantity: i.quantity })),
      }))}
      pending={pending.map((b) => ({
        id:           b.id,
        eventName:    b.eventName,
        eventDate:    b.eventDate.toISOString(),
        expiresAt:    b.expiresAt?.toISOString() ?? null,
        totalAmount:  b.totalAmount.toString(),
        depositAmount: b.depositAmount.toString(),
        clientName:   b.client.fullName,
        clientPhone:  b.client.phone ?? null,
      }))}
    />
  );
}
