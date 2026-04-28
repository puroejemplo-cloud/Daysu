import ChecklistView from "@/components/checklist/ChecklistView";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ChecklistPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { fullName: true, phone: true, email: true } },
      items: {
        where: { isAutoBlocked: false },
        include: { asset: { select: { name: true } } },
      },
    },
  });

  if (!booking) notFound();

  return (
    <div className="admin-page" style={{ maxWidth: "48rem" }}>
      <Link href="/admin/checklists" className="inline-flex items-center gap-1.5 text-xs font-medium mb-8"
        style={{ color: "#52525b", textDecoration: "none" }}>
        ← Checklists
      </Link>

      <div className="aura-card p-6 mb-6">
        <p className="admin-label mb-3">Checklist de logística</p>
        <h1 className="admin-page-title mb-4">{booking.eventName}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="admin-label mb-1">Cliente</p>
            <p style={{ color: "#d4d4d8" }}>{booking.client.fullName}</p>
            {booking.client.phone && <p style={{ color: "#71717a" }}>{booking.client.phone}</p>}
          </div>
          <div>
            <p className="admin-label mb-1">Fecha y hora</p>
            <p style={{ color: "#d4d4d8" }}>{format(new Date(booking.setupAt), "d MMMM yyyy", { locale: es })}</p>
            <p style={{ color: "#71717a" }}>{format(new Date(booking.setupAt), "HH:mm")}h – {format(new Date(booking.teardownAt), "HH:mm")}h</p>
          </div>
          {booking.venueAddress && (
            <div className="col-span-2">
              <p className="admin-label mb-1">Lugar</p>
              <p style={{ color: "#d4d4d8" }}>{booking.venueAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Checklist interactivo */}
      <ChecklistView bookingId={bookingId} />
    </div>
  );
}
