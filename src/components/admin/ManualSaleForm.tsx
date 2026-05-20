"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Category  { id: number; name: string }
interface AssetOpt  { id: number; displayName: string; dailyRate: string; ownerSuffix: string | null }
interface SelItem   { assetId: number; name: string; quantity: number; unitPrice: number }

const EVENT_TYPES = [
  "Boda", "XV Años", "Graduación", "Cumpleaños",
  "Corporativo", "Baby Shower", "Infantil", "Otro",
];

export default function ManualSaleForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [assets, setAssets]    = useState<AssetOpt[]>([]);
  const [selected, setSelected] = useState<SelItem[]>([]);
  const [client, setClient]    = useState({ fullName: "", email: "", phone: "" });
  const [form, setForm]        = useState({
    eventName: "", eventDate: "", setupHour: "19:00",
    venueAddress: "", notes: "", customTotal: "", depositAmount: "",
  });
  const [saving, setSaving]    = useState(false);
  const [error, setError]      = useState("");

  const loadAssets = useCallback(async () => {
    const res = await fetch("/api/admin/assets?rentable=true");
    const json = await res.json();
    setAssets(json.data ?? []);
  }, []);

  useEffect(() => { loadAssets(); }, [loadAssets]);
  // categories prop reserved for future category-filter UI
  void categories;

  const toggleAsset = (a: AssetOpt) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.assetId === a.id);
      if (exists) return prev.filter((s) => s.assetId !== a.id);
      return [...prev, { assetId: a.id, name: a.displayName, quantity: 1, unitPrice: Number(a.dailyRate) }];
    });
  };

  const autoTotal = selected.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total     = form.customTotal ? Number(form.customTotal) : autoTotal;
  const deposit   = form.depositAmount ? Number(form.depositAmount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) { setError("Selecciona al menos un producto."); return; }
    if (!form.eventDate) { setError("La fecha del evento es requerida."); return; }
    setSaving(true); setError("");

    const [sh, sm] = form.setupHour.split(":").map(Number);
    const setup    = new Date(form.eventDate); setup.setHours(sh, sm, 0, 0);
    const teardown = new Date(setup); teardown.setHours(teardown.getHours() + 6);

    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client,
        eventName:     form.eventName || "Evento",
        eventDate:     form.eventDate,
        setupAt:       setup.toISOString(),
        teardownAt:    teardown.toISOString(),
        venueAddress:  form.venueAddress,
        notes:         form.notes,
        totalAmount:   total,
        depositAmount: deposit,
        items:         selected.map((s) => ({ assetId: s.assetId, quantity: s.quantity, overridePrice: s.unitPrice })),
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setSaving(false); return; }
    router.push(`/reserva/${json.data.booking.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de evento — quick select */}
      <div className="aura-card p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Tipo de evento</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => {
            const active = form.eventName === type;
            return (
              <button key={type} type="button"
                onClick={() => setForm((f) => ({ ...f, eventName: active ? "" : type }))}
                className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: active ? "var(--gold)" : "rgba(255,255,255,0.05)",
                  color:      active ? "#05051a"     : "#94A3B8",
                  border:     active ? "1.5px solid var(--gold)" : "1.5px solid rgba(255,255,255,0.1)",
                }}>
                {type}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Nombre / detalle</label>
            <input value={form.eventName} onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
              className="aura-input" placeholder="Ej: Boda García-López" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Fecha *</label>
            <input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              required className="aura-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Hora de inicio</label>
            <input type="time" value={form.setupHour} onChange={(e) => setForm((f) => ({ ...f, setupHour: e.target.value }))}
              className="aura-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Dirección (opcional)</label>
            <input value={form.venueAddress} onChange={(e) => setForm((f) => ({ ...f, venueAddress: e.target.value }))}
              className="aura-input" placeholder="Calle, colonia, ciudad..." />
          </div>
        </div>
      </div>

      {/* Datos del cliente — todos opcionales */}
      <div className="aura-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Cliente</p>
          <span className="text-xs" style={{ color: "#52525b" }}>Todos los campos se pueden completar después</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Nombre completo</label>
            <input type="text" value={client.fullName}
              onChange={(e) => setClient((c) => ({ ...c, fullName: e.target.value }))}
              placeholder="Juan Pérez" className="aura-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Email</label>
            <input type="email" value={client.email}
              onChange={(e) => setClient((c) => ({ ...c, email: e.target.value }))}
              placeholder="juan@correo.com" className="aura-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Teléfono</label>
            <input type="tel" value={client.phone}
              onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))}
              placeholder="+52 492 123 4567" className="aura-input" />
          </div>
        </div>
      </div>

      {/* Selección de productos */}
      <div className="aura-card p-6">
        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>
          Productos ({assets.length} disponibles)
        </p>
        <div className="space-y-2">
          {assets.map((a) => {
            const sel = selected.find((s) => s.assetId === a.id);
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                style={{ borderColor: sel ? "var(--gold)" : "rgba(124,58,237,.2)", background: sel ? "rgba(212,175,55,.07)" : "transparent" }}
                onClick={() => toggleAsset(a)}>
                <div className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: sel ? "var(--gold)" : "rgba(255,255,255,.2)", background: sel ? "var(--gold)" : "transparent" }}>
                  {sel && <span className="text-xs font-black" style={{ color: "#05051a" }}>✓</span>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{a.displayName}</p>
                </div>
                {sel && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Precio:</span>
                    <input type="number" min={0} value={sel.unitPrice}
                      onChange={(e) => setSelected((prev) => prev.map((s) => s.assetId === a.id ? { ...s, unitPrice: Number(e.target.value) } : s))}
                      className="aura-input text-center" style={{ width: 90 }} />
                    <span className="text-xs" style={{ color: "#94A3B8" }}>×</span>
                    <input type="number" min={1} value={sel.quantity}
                      onChange={(e) => setSelected((prev) => prev.map((s) => s.assetId === a.id ? { ...s, quantity: Number(e.target.value) } : s))}
                      className="aura-input text-center" style={{ width: 60 }} />
                  </div>
                )}
                <p className="text-sm font-black flex-shrink-0" style={{ color: "var(--gold)" }}>
                  ${Number(a.dailyRate).toLocaleString("es-MX")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total, anticipo y notas */}
      <div className="aura-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>Total acordado</p>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "#94A3B8" }}>Auto: ${autoTotal.toLocaleString("es-MX")}</span>
              <input type="number" min={0} value={form.customTotal}
                onChange={(e) => setForm((f) => ({ ...f, customTotal: e.target.value }))}
                placeholder={String(autoTotal)} className="aura-input text-right font-black"
                style={{ width: 140, color: "var(--gold)" }} />
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>Anticipo recibido</p>
            <input type="number" min={0} value={form.depositAmount}
              onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))}
              placeholder="0" className="aura-input text-right font-black"
              style={{ color: "#16a34a" }} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Notas internas</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2} className="aura-input resize-none" placeholder="Condiciones especiales, detalles del evento..." />
        </div>
      </div>

      {error && <p className="text-sm font-bold" style={{ color: "#EF4444" }}>{error}</p>}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#94A3B8" }}>Total a registrar</p>
          <p className="text-2xl font-black" style={{ color: "var(--gold)" }}>${total.toLocaleString("es-MX")} MXN</p>
          {deposit > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "#16a34a" }}>
              Anticipo: ${deposit.toLocaleString("es-MX")} — Saldo pendiente: ${(total - deposit).toLocaleString("es-MX")}
            </p>
          )}
        </div>
        <button type="submit" disabled={saving}
          className="font-black px-8 py-3.5 rounded-xl text-base disabled:opacity-50"
          style={{ background: "var(--gold)", color: "#05051a" }}>
          {saving ? "Registrando..." : "✦ Registrar venta"}
        </button>
      </div>
    </form>
  );
}
