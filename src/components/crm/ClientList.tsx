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

const STATUS_COLOR: Record<string, string> = {
  confirmed: "#22c55e", completed: "#94A3B8", pending_payment: "#D4AF37",
  cancelled: "#EF4444", expired: "#475569", in_progress: "#7C3AED",
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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total clientes", value: clients.length, color: "#7C3AED" },
          { label: "Con fechas especiales", value: clients.filter((c) => c.specialDates.length > 0).length, color: "#D4AF37" },
          { label: "Eventos totales", value: clients.reduce((s, c) => s + c._count.bookings, 0), color: "#22c55e" },
        ].map((s) => (
          <div key={s.label} className="aura-card p-4 text-center">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#475569" }}>{s.label}</p>
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
              className="aura-card p-5 flex flex-col md:flex-row md:items-center gap-4 transition-colors hover:border-[var(--gold)] block"
              style={{ textDecoration: "none", borderColor: isSoon ? "rgba(212,175,55,.5)" : undefined }}>

              {/* Avatar */}
              <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-black text-lg"
                style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "#fff" }}>
                {c.fullName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="font-black text-white">{c.fullName}</h3>
                  {c._count.bookings > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(124,58,237,.15)", color: "#9333EA" }}>
                      {c._count.bookings} evento{c._count.bookings !== 1 ? "s" : ""}
                    </span>
                  )}
                  {isSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(212,175,55,.15)", color: "#D4AF37" }}>
                      🎂 {special.label} en {special.days}d
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: "#94A3B8" }}>
                  {c.email}{c.phone && ` · ${c.phone}`}{c.company && ` · ${c.company}`}
                </p>
                {lastEvent && (
                  <p className="text-xs mt-1" style={{ color: "#475569" }}>
                    Último: {lastEvent.eventName} —{" "}
                    {format(new Date(lastEvent.setupAt), "d MMM yyyy", { locale: es })}
                    <span className="ml-1 font-bold" style={{ color: STATUS_COLOR[lastEvent.status] }}>
                      ● {lastEvent.status}
                    </span>
                  </p>
                )}
              </div>

              <div className="text-xs flex-shrink-0" style={{ color: "#475569" }}>
                Cliente desde {format(new Date(c.createdAt), "MMM yyyy", { locale: es })} →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
