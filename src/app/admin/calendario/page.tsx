import { prisma } from "@/lib/prisma";
import CalendarView from "@/components/admin/CalendarView";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { status: { notIn: ["cancelled", "expired"] } },
    select: {
      id: true, eventName: true, eventDate: true, status: true,
      client: { select: { fullName: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <p className="section-label">Agenda</p>
      <h1 className="bebas text-white mb-6" style={{ fontSize: "2.5rem" }}>Calendario de Eventos</h1>
      <CalendarView bookings={bookings.map((b) => ({
        id:        b.id,
        eventName: b.eventName,
        eventDate: b.eventDate.toISOString(),
        status:    b.status,
        clientName: b.client.fullName,
      }))} />
    </div>
  );
}
