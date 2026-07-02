"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BookingDetail {
  id: string;
  eventName: string;
  eventDate: string;
  setupAt: string;
  venueAddress: string | null;
  notes: string | null;
  totalAmount: string;
  depositAmount: string;
  status: string;
  client: { id: number; fullName: string; email: string; phone: string | null };
}

const STATUS_OPTIONS = [
  { value: "pending_payment", label: "Pendiente pago" },
  { value: "confirmed",       label: "Confirmada" },
  { value: "in_progress",     label: "En curso" },
  { value: "completed",       label: "Completada" },
  { value: "cancelled",       label: "Cancelada" },
];

interface Props {
  bookingId: string;
  onClose:   () => void;
  onSaved:   () => void;
}

export default function EditBookingModal({ bookingId, onClose, onSaved }: Props) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    eventName: "", eventDate: "", setupHour: "19:00",
    venueAddress: "", notes: "", totalAmount: "", depositAmount: "", status: "",
  });
  const [client, setClient] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    fetch(`/api/admin/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((json) => {
        const b: BookingDetail = json.data.booking;
        setBooking(b);
        const setup = new Date(b.setupAt);
        const hh    = String(setup.getHours()).padStart(2, "0");
        const mm    = String(setup.getMinutes()).padStart(2, "0");
        const dateStr = b.eventDate.split("T")[0];
        setForm({
          eventName:    b.eventName,
          eventDate:    dateStr,
          setupHour:    `${hh}:${mm}`,
          venueAddress: b.venueAddress ?? "",
          notes:        b.notes ?? "",
          totalAmount:  Number(b.totalAmount).toString(),
          depositAmount: Number(b.depositAmount).toString(),
          status:       b.status,
        });
        setClient({ fullName: b.client.fullName, phone: b.client.phone ?? "" });
        setLoading(false);
      });
  }, [bookingId]);

  const total   = Number(form.totalAmount) || 0;
  const deposit = Number(form.depositAmount) || 0;
  const balance = total - deposit;

  const handleSave = async () => {
    setSaving(true); setError("");

    // Calcular setupAt/teardownAt en el CLIENTE para preservar zona horaria local
    // (si se calcula en el servidor con UTC, 17:00 México → guarda como 17:00 UTC = 11:00 México)
    const [year, month, day] = form.eventDate.split("-").map(Number);
    const [h, m]             = form.setupHour.split(":").map(Number);
    const setupDate          = new Date(year, month - 1, day, h, m, 0, 0);
    const teardownDate       = new Date(setupDate);
    teardownDate.setHours(teardownDate.getHours() + 6);

    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName:     form.eventName,
        eventDate:     form.eventDate,
        setupAt:       setupDate.toISOString(),
        teardownAt:    teardownDate.toISOString(),
        venueAddress:  form.venueAddress,
        notes:         form.notes,
        totalAmount:   total,
        depositAmount: deposit,
        status:        form.status,
        client:        { fullName: client.fullName, phone: client.phone },
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Error al guardar"); setSaving(false); return; }
    onSaved();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9990,
        background: "rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#0a0a18",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        width: "100%", maxWidth: "min(620px, calc(100vw - 1rem))",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "1.5rem 1.5rem 0", gap: "1rem",
        }}>
          <div>
            <p className="admin-label">Editar reserva</p>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.1rem", fontWeight: 600, color: "#e4e4e7" }}>
              {loading ? "Cargando..." : form.eventName}
            </h2>
          </div>
          <button onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#52525b", cursor: "pointer", padding: "0.25rem", flexShrink: 0, marginTop: "0.25rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {!loading && booking && (
          <div className="p-6 space-y-4">
            {/* Evento */}
            <div className="aura-card p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Evento</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Nombre</label>
                  <input value={form.eventName}
                    onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
                    className="aura-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Fecha</label>
                  <input type="date" value={form.eventDate}
                    onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                    className="aura-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Hora inicio</label>
                  <input type="time" value={form.setupHour}
                    onChange={(e) => setForm((f) => ({ ...f, setupHour: e.target.value }))}
                    className="aura-input" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Dirección (opcional)</label>
                  <input value={form.venueAddress}
                    onChange={(e) => setForm((f) => ({ ...f, venueAddress: e.target.value }))}
                    className="aura-input" placeholder="Calle, colonia, ciudad..." />
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="aura-card p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Cliente</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Nombre</label>
                  <input value={client.fullName}
                    onChange={(e) => setClient((c) => ({ ...c, fullName: e.target.value }))}
                    className="aura-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Teléfono</label>
                  <input type="tel" value={client.phone}
                    onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))}
                    className="aura-input" placeholder="Opcional" />
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Email</p>
                  <p className="text-sm" style={{ color: "#52525b" }}>{booking.client.email}</p>
                </div>
              </div>
            </div>

            {/* Finanzas + estado */}
            <div className="aura-card p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Finanzas y estado</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Total acordado</label>
                  <input type="number" min={0} value={form.totalAmount}
                    onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                    className="aura-input font-black" style={{ color: "var(--gold)" }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Anticipo recibido</label>
                  <input type="number" min={0} value={form.depositAmount}
                    onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))}
                    className="aura-input font-black" style={{ color: "#16a34a" }} />
                </div>
                {total > 0 && (
                  <div className="col-span-2 flex items-center gap-3 text-xs" style={{ color: "#52525b" }}>
                    <span>Total: <strong style={{ color: "var(--gold)" }}>${total.toLocaleString("es-MX")}</strong></span>
                    <span>·</span>
                    <span>Anticipo: <strong style={{ color: "#16a34a" }}>${deposit.toLocaleString("es-MX")}</strong></span>
                    <span>·</span>
                    <span>Saldo: <strong style={{ color: balance > 0 ? "#ca8a04" : "#52525b" }}>${balance.toLocaleString("es-MX")}</strong></span>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a1a1aa" }}>Estado</label>
                  <select value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="aura-input">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="aura-card p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: "#a1a1aa" }}>Notas internas</label>
              <textarea value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3} className="aura-input resize-none"
                placeholder="Condiciones especiales, detalles del evento..." />
            </div>

            {error && <p className="text-sm font-bold" style={{ color: "#EF4444" }}>{error}</p>}

            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "transparent", color: "#71717a", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="font-black px-6 py-2.5 rounded-xl text-sm disabled:opacity-50"
                style={{ background: "var(--gold)", color: "#05051a" }}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
