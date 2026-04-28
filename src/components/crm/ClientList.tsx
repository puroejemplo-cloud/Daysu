"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Client {
  id: number; fullName: string; email: string; phone: string | null; company: string | null;
  createdAt: string;
  _count: { bookings: number };
  specialDates: { id: number; label: string; month: number; day: number }[];
  bookings: { eventName: string; setupAt: string; status: string }[];
}

const STATUS_DOT: Record<string, string> = {
  confirmed: "#16a34a", completed: "#52525b", pending_payment: "#ca8a04",
  cancelled: "#dc2626", expired: "#3f3f46", in_progress: "#3b82f6",
};

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ]             = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const json = await res.json();
    setClients(json.data ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  // Próxima fecha especial de un cliente
  const nextSpecial = (dates: Client["specialDates"]) => {
    if (!dates.length) return null;
    const today = new Date();
    const upcoming = dates.map((d) => {
      let next = new Date(today.getFullYear(), d.month - 1, d.day);
      if (next < today) next = new Date(today.getFullYear() + 1, d.month - 1, d.day);
      return { ...d, next, days: Math.ceil((next.getTime() - today.getTime()) / 86_400_000) };
    }).sort((a, b) => a.days - b.days)[0];
    return upcoming;
  };

  return (
    <div className="space-y-5">
      {/* Búsqueda */}
      <input value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, email, teléfono..."
        className="aura-input" style={{ maxWidth: 480 }} />

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total clientes",       value: clients.length },
          { label: "Con fechas especiales", value: clients.filter((c) => c.specialDates.length > 0).length },
          { label: "Eventos totales",      value: clients.reduce((s, c) => s + c._count.bookings, 0) },
        ].map((s) => (
          <div key={s.label} className="aura-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#e4e4e7" }}>{s.value}</p>
            <p className="admin-label mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm" style={{ color: "#94A3B8" }}>Buscando...</p>}

      {!loading && clients.length === 0 && (
        <div className="aura-card p-12 text-center" style={{ color: "#475569" }}>
          {q ? `Sin resultados para "${q}"` : "No hay clientes registrados aún."}
        </div>
      )}

      <div className="space-y-3">
        {clients.map((c) => {
          const special = nextSpecial(c.specialDates);
          const lastEvent = c.bookings[0];
          const isSoon = special && special.days <= 30;

          return (
            <Link key={c.id} href={`/admin/clientes/${c.id}`}
              className="aura-card p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-white/15 transition-all block"
              style={{ textDecoration: "none" }}>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa" }}>
                {c.fullName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold" style={{ color: "#e4e4e7" }}>{c.fullName}</span>
                  {c._count.bookings > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#71717a", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {c._count.bookings} evento{c._count.bookings !== 1 ? "s" : ""}
                    </span>
                  )}
                  {isSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(212,175,55,0.08)", color: "#a16207", border: "1px solid rgba(212,175,55,0.15)" }}>
                      {special.label} · {special.days}d
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "#52525b" }}>
                  {c.email}{c.phone && ` · ${c.phone}`}{c.company && ` · ${c.company}`}
                </p>
                {lastEvent && (
                  <p className="text-xs mt-0.5" style={{ color: "#3f3f46" }}>
                    {lastEvent.eventName} · {format(new Date(lastEvent.setupAt), "d MMM yyyy", { locale: es })}
                    <span className="ml-1.5 inline-flex items-center gap-1">
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: STATUS_DOT[lastEvent.status] ?? "#52525b", display: "inline-block" }} />
                    </span>
                  </p>
                )}
              </div>

              <div className="admin-label flex-shrink-0">
                {format(new Date(c.createdAt), "MMM yyyy", { locale: es })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
