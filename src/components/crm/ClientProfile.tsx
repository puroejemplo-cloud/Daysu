"use client";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface SpecialDate { id: number; label: string; month: number; day: number; year: number | null; notes: string | null }
interface BookingItem { quantity: number; asset: { name: string } }
interface Booking {
  id: string; eventName: string; status: string; setupAt: string; teardownAt: string;
  totalAmount: string; depositAmount: string; items: BookingItem[];
}
interface Client {
  id: number; fullName: string; email: string; phone: string | null; company: string | null;
  taxId: string | null; crmNotes: string | null; preferencias: string | null; referredBy: string | null;
  createdAt: string; specialDates: SpecialDate[]; bookings: Booking[];
}

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  confirmed:       { label: "Confirmada",     color: "#22c55e" },
  completed:       { label: "Completada",     color: "#94A3B8" },
  pending_payment: { label: "Pend. pago",     color: "#D4AF37" },
  cancelled:       { label: "Cancelada",      color: "#EF4444" },
  expired:         { label: "Vencida",        color: "#475569" },
  in_progress:     { label: "En curso",       color: "#7C3AED" },
};

export default function ClientProfile({ client: initial }: { client: Client }) {
  const [client, setClient] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({
    fullName:     client.fullName,
    phone:        client.phone ?? "",
    company:      client.company ?? "",
    taxId:        client.taxId ?? "",
    crmNotes:     client.crmNotes ?? "",
    preferencias: client.preferencias ?? "",
    referredBy:   client.referredBy ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [dateForm, setDateForm] = useState({ label: "", month: "", day: "", year: "", notes: "" });
  const [addingDate, setAddingDate] = useState(false);

  const saveClient = async () => {
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (res.ok) { setClient((c) => ({ ...c, ...json.data })); setEditing(false); }
    setSaving(false);
  };

  const addDate = async () => {
    const res = await fetch(`/api/clients/${client.id}/special-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dateForm, month: Number(dateForm.month), day: Number(dateForm.day), year: dateForm.year ? Number(dateForm.year) : null }),
    });
    const json = await res.json();
    if (res.ok) {
      setClient((c) => ({ ...c, specialDates: [...c.specialDates, json.data].sort((a, b) => a.month - b.month || a.day - b.day) }));
      setDateForm({ label: "", month: "", day: "", year: "", notes: "" });
      setAddingDate(false);
    }
  };

  const deleteDate = async (dateId: number) => {
    if (!confirm("¿Eliminar esta fecha especial?")) return;
    const res = await fetch(`/api/clients/${client.id}/special-dates/${dateId}`, { method: "DELETE" });
    if (res.ok) setClient((c) => ({ ...c, specialDates: c.specialDates.filter((d) => d.id !== dateId) }));
  };

  const totalGastado = client.bookings
    .filter((b) => ["confirmed","completed","in_progress"].includes(b.status))
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="aura-card p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl"
          style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "#fff" }}>
          {client.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="bebas text-white mb-1" style={{ fontSize: "2rem" }}>{client.fullName}</h1>
          <p style={{ color: "#94A3B8" }}>{client.email}{client.phone && ` · ${client.phone}`}</p>
          {client.company && <p className="text-sm" style={{ color: "#475569" }}>{client.company}</p>}
        </div>
        <div className="flex gap-4 text-center flex-shrink-0">
          <div>
            <p className="text-2xl font-black" style={{ color: "#7C3AED" }}>{client.bookings.length}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#475569" }}>Eventos</p>
          </div>
          <div>
            <p className="text-2xl font-black" style={{ color: "#D4AF37" }}>${totalGastado.toLocaleString("es-MX")}</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#475569" }}>Total</p>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)}
          className="text-sm font-bold px-4 py-2 rounded-lg border transition-colors flex-shrink-0"
          style={{ borderColor: "rgba(124,58,237,.3)", color: "#94A3B8" }}>
          {editing ? "Cancelar" : "✎ Editar"}
        </button>
      </div>

      {/* Formulario edición */}
      {editing && (
        <div className="aura-card p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#7C3AED" }}>Editar datos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Nombre completo", key: "fullName" },
              { label: "Teléfono",        key: "phone" },
              { label: "Empresa",         key: "company" },
              { label: "RFC / ID fiscal", key: "taxId" },
              { label: "¿Cómo nos encontró?", key: "referredBy" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>{label}</label>
                <input value={(form as never)[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="aura-input" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Preferencias / Estilo del cliente</label>
            <textarea value={form.preferencias} onChange={(e) => setForm((f) => ({ ...f, preferencias: e.target.value }))}
              rows={2} className="aura-input resize-none" placeholder="Colores favoritos, tipo de música, estilo de evento..." />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Notas internas (CRM)</label>
            <textarea value={form.crmNotes} onChange={(e) => setForm((f) => ({ ...f, crmNotes: e.target.value }))}
              rows={2} className="aura-input resize-none" placeholder="Notas privadas del equipo sobre este cliente..." />
          </div>
          <button onClick={saveClient} disabled={saving}
            className="font-black px-6 py-2.5 rounded-lg text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "#fff" }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Info rápida */}
      {!editing && (client.preferencias || client.crmNotes || client.referredBy) && (
        <div className="aura-card p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {client.referredBy && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#7C3AED" }}>Nos encontró por</p>
              <p className="text-white">{client.referredBy}</p>
            </div>
          )}
          {client.preferencias && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#7C3AED" }}>Preferencias</p>
              <p style={{ color: "#94A3B8" }}>{client.preferencias}</p>
            </div>
          )}
          {client.crmNotes && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#7C3AED" }}>Notas internas</p>
              <p style={{ color: "#94A3B8" }}>{client.crmNotes}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fechas especiales */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#D4AF37" }}>🎂 Fechas especiales</p>
            <button onClick={() => setAddingDate(!addingDate)}
              className="text-xs font-bold px-3 py-1 rounded-lg border transition-colors"
              style={{ borderColor: "rgba(212,175,55,.3)", color: "#D4AF37" }}>
              {addingDate ? "Cancelar" : "+ Agregar"}
            </button>
          </div>

          {addingDate && (
            <div className="aura-card p-4 space-y-3">
              <input value={dateForm.label} onChange={(e) => setDateForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Tipo (Cumpleaños, Aniversario...)" className="aura-input" />
              <div className="grid grid-cols-3 gap-2">
                <select value={dateForm.month} onChange={(e) => setDateForm((f) => ({ ...f, month: e.target.value }))} className="aura-select">
                  <option value="">Mes</option>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" min={1} max={31} value={dateForm.day} onChange={(e) => setDateForm((f) => ({ ...f, day: e.target.value }))}
                  placeholder="Día" className="aura-input" />
                <input type="number" min={1900} max={2025} value={dateForm.year} onChange={(e) => setDateForm((f) => ({ ...f, year: e.target.value }))}
                  placeholder="Año" className="aura-input" />
              </div>
              <input value={dateForm.notes} onChange={(e) => setDateForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Nota opcional" className="aura-input" />
              <button onClick={addDate}
                className="w-full py-2 font-black text-sm rounded-lg"
                style={{ background: "var(--gold)", color: "#05051a" }}>
                Guardar fecha
              </button>
            </div>
          )}

          {client.specialDates.length === 0 && !addingDate && (
            <p className="text-sm" style={{ color: "#475569" }}>Sin fechas especiales registradas.</p>
          )}

          {client.specialDates.map((d) => {
            const today = new Date();
            let next = new Date(today.getFullYear(), d.month - 1, d.day);
            if (next < today) next = new Date(today.getFullYear() + 1, d.month - 1, d.day);
            const days = Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
            const soon = days <= 30;

            return (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: soon ? "rgba(212,175,55,.07)" : "var(--bg-card)", borderColor: soon ? "rgba(212,175,55,.3)" : "rgba(124,58,237,.15)" }}>
                <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: soon ? "var(--gold)" : "rgba(124,58,237,.15)" }}>
                  <span className="text-xs font-black leading-none" style={{ color: soon ? "#05051a" : "#7C3AED" }}>{MONTHS[d.month - 1]}</span>
                  <span className="text-lg font-black leading-none" style={{ color: soon ? "#05051a" : "#f5f0e8" }}>{d.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">{d.label}</p>
                  <p className="text-xs" style={{ color: soon ? "#D4AF37" : "#475569" }}>
                    {soon ? `🎉 En ${days} día${days !== 1 ? "s" : ""}` : `En ${days} días`}
                    {d.year && ` · ${next.getFullYear() - d.year} años`}
                  </p>
                </div>
                <button onClick={() => deleteDate(d.id)} className="text-xs" style={{ color: "#475569" }}>✕</button>
              </div>
            );
          })}
        </div>

        {/* Historial de eventos */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>📋 Historial de eventos</p>
          {client.bookings.length === 0 && (
            <p className="text-sm" style={{ color: "#475569" }}>Sin eventos registrados.</p>
          )}
          {client.bookings.map((b) => {
            const st = STATUS_LABEL[b.status] ?? { label: b.status, color: "#94A3B8" };
            return (
              <Link key={b.id} href={`/reserva/${b.id}`}
                className="flex items-start gap-3 p-3 rounded-xl border transition-colors hover:border-[var(--gold)]"
                style={{ background: "var(--bg-card)", borderColor: "rgba(124,58,237,.15)", textDecoration: "none" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{b.eventName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                    {format(new Date(b.setupAt), "d MMM yyyy", { locale: es })}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                    {b.items.map((i) => i.asset.name).join(", ")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black" style={{ color: "#D4AF37" }}>
                    ${Number(b.totalAmount).toLocaleString("es-MX")}
                  </p>
                  <p className="text-xs font-bold" style={{ color: st.color }}>{st.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
