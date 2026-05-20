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
      id: true, eventName: true, eventDate: true, setupAt: true, status: true,
      client: { select: { fullName: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Agenda</p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <h1 className="admin-page-title" style={{ margin: 0 }}>Calendario de Eventos</h1>
          <a
            href="/api/calendar"
            download="aura-reservas.ics"
            className="btn-ghost"
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Exportar .ics
          </a>
        </div>
      </header>
      <CalendarView bookings={bookings.map((b) => ({
        id:         b.id,
        eventName:  b.eventName,
        eventDate:  b.eventDate.toISOString(),
        setupAt:    b.setupAt.toISOString(),
        status:     b.status,
        clientName: b.client.fullName,
      }))} />
    </div>
  );
}
