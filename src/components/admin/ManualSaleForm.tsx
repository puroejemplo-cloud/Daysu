"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Category  { id: number; name: string }
interface AssetOpt  { id: number; displayName: string; dailyRate: string; ownerSuffix: string | null }
interface SelItem   { assetId: number; name: string; quantity: number; unitPrice: number }

export default function ManualSaleForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [assets, setAssets]  = useState<AssetOpt[]>([]);
  const [selected, setSelected] = useState<SelItem[]>([]);
  const [client, setClient]  = useState({ fullName: "", email: "", phone: "" });
  const [form, setForm]      = useState({ eventName: "", eventDate: "", setupHour: "19:00", teardownHour: "01:00", venueAddress: "", notes: "", customTotal: "" });
  const [saving, setSaving]  = useState(false);
  const [error, setError]    = useState("");

  const loadAssets = useCallback(async () => {
    const res = await fetch("/api/admin/assets?rentable=true");
    const json = await res.json();
    setAssets(json.data ?? []);
  }, []);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const toggleAsset = (a: AssetOpt) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.assetId === a.id);
      if (exists) return prev.filter((s) => s.assetId !== a.id);
      return [...prev, { assetId: a.id, name: a.displayName, quantity: 1, unitPrice: Number(a.dailyRate) }];
    });
  };

  const autoTotal = selected.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total     = form.customTotal ? Number(form.customTotal) : autoTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) { setError("Selecciona al menos un producto."); return; }
    setSaving(true); setError("");

    const [sh, sm] = form.setupHour.split(":").map(Number);
    const [th, tm] = form.teardownHour.split(":").map(Number);
    const setup    = new Date(form.eventDate); setup.setHours(sh, sm, 0, 0);
    const teardown = new Date(form.eventDate); teardown.setHours(th, tm, 0, 0);
    if (teardown <= setup) teardown.setDate(teardown.getDate() + 1);

    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client,
        eventName:    form.eventName,
        eventDate:    form.eventDate,
        setupAt:      setup.toISOString(),
        teardownAt:   teardown.toISOString(),
        venueAddress: form.venueAddress,
        notes:        form.notes,
        totalAmount:  total,
        items:        selected.map((s) => ({ assetId: s.assetId, quantity: s.quantity, overridePrice: s.unitPrice })),
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setSaving(false); return; }
    router.push(`/reserva/${json.data.booking.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos del evento */}
      <div className="aura-card p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Datos del evento</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Nombre del evento</label>
            <input value={form.eventName} onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))} required className="aura-input" placeholder="Boda García-López" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Fecha</label>
            <input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} required className="aura-input" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Hora inicio</label>
              <input type="time" value={form.setupHour} onChange={(e) => setForm((f) => ({ ...f, setupHour: e.target.value }))} className="aura-input" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Hora fin</label>
              <input type="time" value={form.teardownHour} onChange={(e) => setForm((f) => ({ ...f, teardownHour: e.target.value }))} className="aura-input" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Dirección</label>
            <input value={form.venueAddress} onChange={(e) => setForm((f) => ({ ...f, venueAddress: e.target.value }))} className="aura-input" placeholder="Calle, colonia, ciudad..." />
          </div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="aura-card p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Cliente</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Nombre completo *", key: "fullName", placeholder: "Juan Pérez" },
            { label: "Email *",           key: "email",    placeholder: "juan@correo.com", type: "email" },
            { label: "Teléfono",          key: "phone",    placeholder: "+52 492 123 4567", type: "tel" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>{label}</label>
              <input type={type ?? "text"} value={(client as never)[key] as string}
                onChange={(e) => setClient((c) => ({ ...c, [key]: e.target.value }))}
                placeholder={placeholder} required={key !== "phone"} className="aura-input" />
            </div>
          ))}
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

      {/* Total y notas */}
      <div className="aura-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Total acordado</p>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "#94A3B8" }}>Auto: ${autoTotal.toLocaleString("es-MX")}</span>
            <input type="number" min={0} value={form.customTotal} onChange={(e) => setForm((f) => ({ ...f, customTotal: e.target.value }))}
              placeholder={String(autoTotal)} className="aura-input text-right font-black" style={{ width: 140, color: "var(--gold)" }} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Notas internas</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2} className="aura-input resize-none" placeholder="Condiciones especiales, anticipo recibido..." />
        </div>
      </div>

      {error && <p className="text-sm font-bold" style={{ color: "#EF4444" }}>{error}</p>}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#94A3B8" }}>Total a registrar</p>
          <p className="text-2xl font-black" style={{ color: "var(--gold)" }}>${total.toLocaleString("es-MX")} MXN</p>
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
