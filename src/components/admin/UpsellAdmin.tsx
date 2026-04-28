"use client";
import { useEffect, useState, useCallback } from "react";

interface Asset { id: number; name: string }
interface Rule {
  id: number; discountPercent: number; label: string | null; isActive: boolean;
  sourceAsset: Asset; suggestedAsset: Asset;
}

export default function UpsellAdmin({ assets }: { assets: Asset[] }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ sourceAssetId: "", suggestedAssetId: "", discountPercent: "10", label: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/upsell-rules");
    const json = await res.json();
    setRules(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/upsell-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceAssetId: Number(form.sourceAssetId),
        suggestedAssetId: Number(form.suggestedAssetId),
        discountPercent: Number(form.discountPercent),
        label: form.label || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setSaving(false); return; }
    setForm({ sourceAssetId: "", suggestedAssetId: "", discountPercent: "10", label: "" });
    await load();
    setSaving(false);
  };

  const toggleActive = async (rule: Rule) => {
    await fetch(`/api/upsell-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    await load();
  };

  const deleteRule = async (id: number) => {
    if (!confirm("¿Eliminar esta regla?")) return;
    await fetch(`/api/upsell-rules/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-5">
      {/* Formulario nueva regla */}
      <form onSubmit={handleCreate} className="aura-card p-5 space-y-4">
        <p className="admin-label">Nueva regla de upsell</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="admin-label block mb-1.5">Cuando elija...</label>
            <select value={form.sourceAssetId} onChange={(e) => setForm((f) => ({ ...f, sourceAssetId: e.target.value }))}
              required className="aura-select">
              <option value="">— Origen —</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="admin-label block mb-1.5">Sugerir...</label>
            <select value={form.suggestedAssetId} onChange={(e) => setForm((f) => ({ ...f, suggestedAssetId: e.target.value }))}
              required className="aura-select">
              <option value="">— Sugerido —</option>
              {assets.filter((a) => String(a.id) !== form.sourceAssetId)
                .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="admin-label block mb-1.5">Descuento (%)</label>
            <input type="number" min="0" max="100" value={form.discountPercent}
              onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
              required className="aura-input" style={{ width: 100 }} />
          </div>
          <div>
            <label className="admin-label block mb-1.5">Texto del banner (opcional)</label>
            <input type="text" value={form.label} placeholder="¡Complementa tu evento con..."
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="aura-input" />
          </div>
        </div>
        {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
        <button type="submit" disabled={saving}
          className="px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-40 transition-all"
          style={{ background: "rgba(255,255,255,0.08)", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.1)" }}>
          {saving ? "Guardando..." : "+ Crear regla"}
        </button>
      </form>

      {/* Lista de reglas */}
      <div className="aura-card overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="admin-label">Reglas configuradas · {rules.filter((r) => r.isActive).length} activas</p>
        </div>
        {loading && <p className="text-sm p-5" style={{ color: "#52525b" }}>Cargando...</p>}
        {!loading && rules.length === 0 && (
          <p className="text-sm p-5" style={{ color: "#3f3f46" }}>Sin reglas configuradas.</p>
        )}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-4 px-5 py-3.5"
              style={{ opacity: rule.isActive ? 1 : 0.4 }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#d4d4d8" }}>
                  <span className="font-medium">{rule.sourceAsset.name}</span>
                  <span style={{ color: "#3f3f46", margin: "0 0.5rem" }}>→</span>
                  <span className="font-medium">{rule.suggestedAsset.name}</span>
                  {Number(rule.discountPercent) > 0 && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(22,163,74,0.1)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.2)" }}>
                      -{rule.discountPercent}%
                    </span>
                  )}
                </p>
                {rule.label && <p className="text-xs mt-0.5 truncate" style={{ color: "#52525b" }}>{rule.label}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(rule)}
                  className="text-xs px-3 py-1.5 rounded-md border transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.08)", color: "#71717a", background: "transparent" }}>
                  {rule.isActive ? "Pausar" : "Activar"}
                </button>
                <button onClick={() => deleteRule(rule.id)}
                  className="text-xs px-3 py-1.5 rounded-md border transition-all"
                  style={{ borderColor: "rgba(220,38,38,0.2)", color: "#71717a", background: "transparent" }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
