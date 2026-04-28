import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage() {
  // Eventos confirmados o en curso, ordenados por fecha más próxima
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ["confirmed", "in_progress"] } },
    include: {
      client: { select: { fullName: true, phone: true } },
      items: {
        where: { isAutoBlocked: false },
        include: { asset: { select: { name: true } } },
        take: 1,
      },
      checklists: {
        include: { items: { select: { checked: true } } },
      },
    },
    orderBy: { setupAt: "asc" },
  });

  const progress = (booking: typeof bookings[0], phase: "salida" | "entrada") => {
    const cl = booking.checklists.find((c) => c.phase === phase);
    if (!cl) return null;
    const total = cl.items.length;
    const done  = cl.items.filter((i) => i.checked).length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0, completed: !!cl.completedAt };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="section-label">Módulo 4</p>
      <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Checklists de Logística</h1>
      <p className="mb-8" style={{ color: "#94A3B8" }}>
        Eventos confirmados — verifica salida y entrada de equipo.
      </p>

      {bookings.length === 0 && (
        <div className="aura-card p-12 text-center" style={{ color: "#475569" }}>
          No hay eventos confirmados próximos.
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((b) => {
          const sal = progress(b, "salida");
          const ent = progress(b, "entrada");
          const isToday = new Date(b.setupAt).toDateString() === new Date().toDateString();

          return (
            <Link key={b.id} href={`/admin/checklists/${b.id}`}
              className="aura-card p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-[var(--gold)] transition-colors block"
              style={{ textDecoration: "none" }}>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isToday && (
                    <span className="text-xs font-black px-2 py-0.5 rounded"
                      style={{ background: "var(--red)", color: "#fff", letterSpacing: "0.1em" }}>
                      HOY
                    </span>
                  )}
                  <h3 className="font-black text-white truncate">{b.eventName}</h3>
                </div>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  {b.client.fullName}
                  {b.client.phone && ` · ${b.client.phone}`}
                </p>
                <p className="text-xs mt-1" style={{ color: "#475569" }}>
                  📅 {format(new Date(b.setupAt), "EEEE d MMM yyyy · HH:mm'h'", { locale: es })}
                </p>
              </div>

              {/* Badges de progreso */}
              <div className="flex gap-3 flex-shrink-0">
                {(["salida", "entrada"] as const).map((phase) => {
                  const p = phase === "salida" ? sal : ent;
                  return (
                    <div key={phase} className="text-center min-w-[80px]">
                      <p className="text-xs font-black uppercase tracking-widest mb-1"
                        style={{ color: phase === "salida" ? "#7C3AED" : "#c9a84c" }}>
                        {phase}
                      </p>
                      {p ? (
                        <>
                          <div className="text-sm font-black" style={{ color: p.completed ? "#22c55e" : "#f5f0e8" }}>
                            {p.completed ? "✓ Listo" : `${p.done}/${p.total}`}
                          </div>
                          <div className="w-full h-1 rounded-full mt-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="h-1 rounded-full transition-all"
                              style={{ width: `${p.pct}%`, background: p.completed ? "#22c55e" : phase === "salida" ? "#7C3AED" : "var(--gold)" }} />
                          </div>
                        </>
                      ) : (
                        <div className="text-xs" style={{ color: "#475569" }}>Pendiente</div>
                      )}
                    </div>
                  );
                })}
                <div className="flex items-center" style={{ color: "#475569" }}>→</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
