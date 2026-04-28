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
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/admin/checklists" className="text-sm font-bold mb-6 inline-flex items-center gap-1"
        style={{ color: "#94A3B8", textDecoration: "none" }}>
        ← Todos los eventos
      </Link>

      {/* Header del evento */}
      <div className="aura-card p-6 mb-8" style={{ borderColor: "rgba(201,168,76,0.3)" }}>
        <p className="section-label mb-1">Checklist de logística</p>
        <h1 className="bebas text-white mb-2" style={{ fontSize: "2rem" }}>{booking.eventName}</h1>
        <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: "#94A3B8" }}>
          <div>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>Cliente</span>
            <p className="text-white">{booking.client.fullName}</p>
            {booking.client.phone && <p>{booking.client.phone}</p>}
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>Fecha y hora</span>
            <p className="text-white">{format(new Date(booking.setupAt), "d MMMM yyyy", { locale: es })}</p>
            <p>{format(new Date(booking.setupAt), "HH:mm")}h – {format(new Date(booking.teardownAt), "HH:mm")}h</p>
          </div>
          {booking.venueAddress && (
            <div className="col-span-2">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>Lugar</span>
              <p className="text-white">{booking.venueAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Checklist interactivo */}
      <ChecklistView bookingId={bookingId} />
    </div>
  );
}
