"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus, X, Users } from "lucide-react";

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

const EMPTY_FORM = { fullName: "", email: "", phone: "", company: "", referredBy: "" };

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ]             = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formErr, setFormErr]   = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showForm) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [showForm]);

  const openForm  = () => { setForm(EMPTY_FORM); setFormErr(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setFormErr(null); };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setFormErr(json.error ?? "Error al guardar"); return; }
    closeForm();
    load();
  };

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
      {/* Cabecera: búsqueda + botón nuevo */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono..."
          className="aura-input" style={{ flex: 1, minWidth: 220, maxWidth: 480 }} />
        <button onClick={openForm}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
            background: "var(--gold)", color: "#05051a", border: "none", cursor: "pointer",
            flexShrink: 0,
          }}>
          <UserPlus size={14} /> Nuevo cliente
        </button>
      </div>

      {/* Modal — nuevo cliente */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={closeForm} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: 460,
            background: "#0f0f13", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "1.5rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e4e4e7" }}>Nuevo cliente</h2>
              <button onClick={closeForm} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveClient} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { key: "fullName",   label: "Nombre completo *", type: "text",  required: true  },
                { key: "email",      label: "Email *",           type: "email", required: true  },
                { key: "phone",      label: "Teléfono",          type: "tel",   required: false },
                { key: "company",    label: "Empresa",           type: "text",  required: false },
                { key: "referredBy", label: "¿Cómo nos encontró?", type: "text", required: false },
              ].map((f, i) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#71717a", marginBottom: "0.3rem" }}>{f.label}</label>
                  <input
                    ref={i === 0 ? firstInputRef : undefined}
                    type={f.type}
                    required={f.required}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="aura-input"
                    style={{ width: "100%" }}
                  />
                </div>
              ))}
              {formErr && <p style={{ fontSize: "0.78rem", color: "#f87171" }}>{formErr}</p>}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 1, padding: "0.6rem", borderRadius: 8, fontWeight: 600,
                    fontSize: "0.82rem", background: "var(--gold)", color: "#05051a",
                    border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                  }}>
                  {saving ? "Guardando..." : "Crear cliente"}
                </button>
                <button type="button" onClick={closeForm}
                  style={{
                    padding: "0.6rem 1rem", borderRadius: 8, fontSize: "0.82rem",
                    background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#71717a", cursor: "pointer",
                  }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <div className="empty-state">
          <Users size={36} className="empty-state-icon" />
          <p className="empty-state-title">{q ? "Sin resultados" : "Sin clientes aún"}</p>
          <p className="empty-state-desc">
            {q ? `No hay clientes que coincidan con "${q}".` : "Crea el primero con el botón Nuevo cliente."}
          </p>
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
