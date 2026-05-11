import { prisma } from "@/lib/prisma";
import CalendarView from "@/components/admin/CalendarView";
import { auth } from "@/auth";
import { redirect } from "next/navigation";


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
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Agenda</p>
        <h1 className="admin-page-title">Calendario de Eventos</h1>
      </header>
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
