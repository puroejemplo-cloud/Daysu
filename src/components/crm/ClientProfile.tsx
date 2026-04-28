"use client";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Pencil, X } from "lucide-react";

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
const STATUS_BADGE: Record<string, { label: string; dot: string }> = {
  confirmed:       { label: "Confirmada",  dot: "#16a34a" },
  completed:       { label: "Completada", dot: "#52525b" },
  pending_payment: { label: "Pend. pago", dot: "#ca8a04" },
  cancelled:       { label: "Cancelada",  dot: "#dc2626" },
  expired:         { label: "Vencida",    dot: "#3f3f46" },
  in_progress:     { label: "En curso",   dot: "#3b82f6" },
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
      <div className="aura-card p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-base"
          style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa" }}>
          {client.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white">{client.fullName}</h1>
          <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>{client.email}{client.phone && ` · ${client.phone}`}</p>
          {client.company && <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>{client.company}</p>}
        </div>
        <div className="flex gap-5 text-center flex-shrink-0">
          <div>
            <p className="text-xl font-bold" style={{ color: "#e4e4e7" }}>{client.bookings.length}</p>
            <p className="admin-label">Eventos</p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: "#d4af37" }}>${totalGastado.toLocaleString("es-MX")}</p>
            <p className="admin-label">Total</p>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-all flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.08)", color: "#71717a", background: "transparent" }}>
          <Pencil size={13} />
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      {/* Formulario edición */}
      {editing && (
        <div className="aura-card p-5 space-y-4">
          <p className="admin-label">Editar datos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Nombre completo",    key: "fullName" },
              { label: "Teléfono",           key: "phone" },
              { label: "Empresa",            key: "company" },
              { label: "RFC / ID fiscal",    key: "taxId" },
              { label: "¿Cómo nos encontró?", key: "referredBy" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="admin-label block mb-1.5">{label}</label>
                <input value={(form as never)[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="aura-input" />
              </div>
            ))}
          </div>
          <div>
            <label className="admin-label block mb-1.5">Preferencias / Estilo</label>
            <textarea value={form.preferencias} onChange={(e) => setForm((f) => ({ ...f, preferencias: e.target.value }))}
              rows={2} className="aura-input resize-none" placeholder="Colores, música, estilo de evento..." />
          </div>
          <div>
            <label className="admin-label block mb-1.5">Notas internas (CRM)</label>
            <textarea value={form.crmNotes} onChange={(e) => setForm((f) => ({ ...f, crmNotes: e.target.value }))}
              rows={2} className="aura-input resize-none" placeholder="Notas privadas del equipo..." />
          </div>
          <button onClick={saveClient} disabled={saving}
            className="font-semibold px-5 py-2.5 rounded-lg text-sm disabled:opacity-50"
            style={{ background: "var(--gold)", color: "#05051a" }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Info rápida */}
      {!editing && (client.preferencias || client.crmNotes || client.referredBy) && (
        <div className="aura-card p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {client.referredBy && (
            <div>
              <p className="admin-label mb-1">Nos encontró por</p>
              <p style={{ color: "#d4d4d8" }}>{client.referredBy}</p>
            </div>
          )}
          {client.preferencias && (
            <div>
              <p className="admin-label mb-1">Preferencias</p>
              <p style={{ color: "#71717a" }}>{client.preferencias}</p>
            </div>
          )}
          {client.crmNotes && (
            <div>
              <p className="admin-label mb-1">Notas internas</p>
              <p style={{ color: "#71717a" }}>{client.crmNotes}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fechas especiales */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="admin-label">Fechas especiales</p>
            <button onClick={() => setAddingDate(!addingDate)}
              className="text-xs font-medium px-3 py-1.5 rounded-md border transition-all"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "#71717a", background: "transparent" }}>
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
              <div key={d.id} className="aura-card flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: soon ? "rgba(212,175,55,0.12)" : "#18181b", border: `1px solid ${soon ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                  <span className="text-xs leading-none" style={{ color: soon ? "#d4af37" : "#52525b" }}>{MONTHS[d.month - 1]}</span>
                  <span className="text-sm font-bold leading-none" style={{ color: soon ? "#d4af37" : "#a1a1aa" }}>{d.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#d4d4d8" }}>{d.label}</p>
                  <p className="text-xs" style={{ color: soon ? "#a16207" : "#52525b" }}>
                    En {days} día{days !== 1 ? "s" : ""}
                    {d.year && ` · ${next.getFullYear() - d.year} años`}
                  </p>
                </div>
                <button onClick={() => deleteDate(d.id)}>
                  <X size={14} style={{ color: "#3f3f46" }} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Historial de eventos */}
        <div className="space-y-2">
          <p className="admin-label">Historial de eventos</p>
          {client.bookings.length === 0 && (
            <p className="text-sm" style={{ color: "#52525b" }}>Sin eventos registrados.</p>
          )}
          {client.bookings.map((b) => {
            const st = STATUS_BADGE[b.status] ?? { label: b.status, dot: "#52525b" };
            return (
              <Link key={b.id} href={`/reserva/${b.id}`}
                className="aura-card flex items-start gap-3 p-3 hover:border-white/15 transition-all block"
                style={{ textDecoration: "none" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{b.eventName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>
                    {format(new Date(b.setupAt), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold" style={{ color: "#d4af37" }}>
                    ${Number(b.totalAmount).toLocaleString("es-MX")}
                  </p>
                  <p className="text-xs flex items-center justify-end gap-1 mt-0.5">
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                    <span style={{ color: "#71717a" }}>{st.label}</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
