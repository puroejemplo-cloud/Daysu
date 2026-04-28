import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default async function RecordatoriosPage() {
  const allDates = await prisma.clientSpecialDate.findMany({
    include: { client: { select: { id: true, fullName: true, phone: true, email: true } } },
  });

  const today = new Date();
  const upcoming = allDates
    .map((d) => {
      let next = new Date(today.getFullYear(), d.month - 1, d.day);
      if (next < today) next = new Date(today.getFullYear() + 1, d.month - 1, d.day);
      const days = Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
      const age  = d.year ? next.getFullYear() - d.year : null;
      return { ...d, next, days, age };
    })
    .filter((d) => d.days <= 60)
    .sort((a, b) => a.days - b.days);

  const urgente  = upcoming.filter((d) => d.days <= 7);
  const proximo  = upcoming.filter((d) => d.days > 7 && d.days <= 30);
  const mes      = upcoming.filter((d) => d.days > 30);

  const Section = ({ title, color, items }: { title: string; color: string; items: typeof upcoming }) => (
    items.length === 0 ? null : (
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color }}>{title}</p>
        <div className="space-y-3">
          {items.map((d) => (
            <div key={d.id} className="aura-card p-4 flex items-center gap-4">
              {/* Fecha badge */}
              <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                <span className="text-xs font-black leading-none" style={{ color }}>{MONTHS[d.month - 1]}</span>
                <span className="text-xl font-black leading-none text-white">{d.day}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-black text-white">{d.client.fullName}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${color}15`, color }}>
                    {d.label}{d.age && ` — ${d.age} años`}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                  {d.client.email}{d.client.phone && ` · ${d.client.phone}`}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xl font-black" style={{ color }}>{d.days}</p>
                  <p className="text-xs" style={{ color: "#475569" }}>días</p>
                </div>
                {d.client.phone && (
                  <a href={`https://wa.me/52${d.client.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-black px-3 py-2 rounded-lg transition-colors"
                    style={{ background: "rgba(37,211,102,.15)", color: "#25D166", border: "1px solid rgba(37,211,102,.3)" }}>
                    WhatsApp
                  </a>
                )}
                <Link href={`/admin/clientes/${d.client.id}`}
                  className="text-xs font-bold px-3 py-2 rounded-lg"
                  style={{ background: "rgba(124,58,237,.15)", color: "#9333EA", border: "1px solid rgba(124,58,237,.3)", textDecoration: "none" }}>
                  Ver ficha
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="section-label">CRM · Módulo 5</p>
        <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Recordatorios</h1>
        <p style={{ color: "#94A3B8" }}>
          Fechas especiales de clientes en los próximos 60 días — contacta antes que nadie.
        </p>
      </div>

      {upcoming.length === 0 && (
        <div className="aura-card p-12 text-center" style={{ color: "#475569" }}>
          No hay fechas especiales en los próximos 60 días.
          <br />
          <Link href="/admin/clientes" className="text-sm mt-2 inline-block" style={{ color: "#7C3AED" }}>
            Agrega fechas desde la ficha de cada cliente →
          </Link>
        </div>
      )}

      <Section title="🔴 Esta semana (urgente)"  color="#EF4444" items={urgente} />
      <Section title="🟡 Próximos 30 días"       color="#D4AF37" items={proximo} />
      <Section title="⚪ En los siguientes 30 días" color="#475569" items={mes}  />
    </div>
  );
}
