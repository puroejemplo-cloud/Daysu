import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Secciones con dot de color semántico — sin emojis, sin borders de tarjeta
const SECTIONS = [
  { key: "urgente", label: "Esta semana",       dot: "#dc2626", days: [0,  7]  },
  { key: "proximo", label: "Próximos 30 días",  dot: "#ca8a04", days: [8,  30] },
  { key: "mes",     label: "Días 31–60",        dot: "#52525b", days: [31, 60] },
] as const;

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="admin-label mb-2">Recordatorios</p>
        <h1 className="text-2xl font-bold text-white mb-1">Fechas especiales</h1>
        <p className="text-sm" style={{ color: "#71717a" }}>
          Clientes con fechas en los próximos 60 días.
        </p>
      </div>

      {upcoming.length === 0 && (
        <div className="aura-card p-10 text-center" style={{ color: "#3f3f46" }}>
          Sin fechas especiales en los próximos 60 días.
          <br />
          <Link href="/admin/clientes" className="text-sm mt-2 inline-block" style={{ color: "#71717a", textDecoration: "none" }}>
            Agrega fechas desde la ficha de cada cliente →
          </Link>
        </div>
      )}

      {SECTIONS.map(({ key, label, dot, days: [min, max] }) => {
        const items = upcoming.filter((d) => d.days >= min && d.days <= max);
        if (!items.length) return null;
        return (
          <div key={key}>
            {/* Encabezado de sección — dot + label */}
            <div className="flex items-center gap-2 mb-3">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />
              <p className="admin-label">{label}</p>
            </div>

            <div className="space-y-2">
              {items.map((d) => (
                <div key={d.id} className="aura-card p-4 flex items-center gap-4">
                  {/* Fecha — bloque compacto neutral */}
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-xs leading-none" style={{ color: "#52525b" }}>{MONTHS[d.month - 1]}</span>
                    <span className="text-sm font-bold leading-none" style={{ color: "#a1a1aa" }}>{d.day}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "#e4e4e7" }}>{d.client.fullName}</span>
                      {/* Badge minimalista — texto + fondo tenue */}
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#71717a" }}>
                        {d.label}{d.age && ` · ${d.age} años`}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                      {d.client.email}{d.client.phone && ` · ${d.client.phone}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Contador días */}
                    <div className="text-right w-12">
                      <p className="text-lg font-bold" style={{ color: dot }}>{d.days}</p>
                      <p className="admin-label">días</p>
                    </div>

                    {/* Acciones — botón gold = acción primaria */}
                    {d.client.phone && (
                      <a href={`https://wa.me/52${d.client.phone.replace(/\D/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
                        style={{ background: "var(--gold)", color: "#05051a" }}>
                        WhatsApp
                      </a>
                    )}
                    <Link href={`/admin/clientes/${d.client.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border transition-all"
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "#71717a", textDecoration: "none" }}>
                      Ver ficha
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
