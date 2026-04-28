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
    <div className="space-y-8">
      {/* Formulario nueva regla */}
      <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-bold text-[#1e3a5f]">Nueva regla</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">CUANDO ELIJA...</label>
            <select value={form.sourceAssetId} onChange={(e) => setForm((f) => ({ ...f, sourceAssetId: e.target.value }))}
              required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— Selecciona activo origen —</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">SUGERIR...</label>
            <select value={form.suggestedAssetId} onChange={(e) => setForm((f) => ({ ...f, suggestedAssetId: e.target.value }))}
              required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— Selecciona activo sugerido —</option>
              {assets.filter((a) => String(a.id) !== form.sourceAssetId)
                .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">DESCUENTO (%)</label>
            <input type="number" min="1" max="100" value={form.discountPercent}
              onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
              required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">TEXTO DEL BANNER (opcional)</label>
            <input type="text" value={form.label} placeholder="¡Complementa tu evento con..."
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={saving}
          className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#2d5a9e] disabled:opacity-50 transition-colors">
          {saving ? "Guardando..." : "+ Crear regla"}
        </button>
      </form>

      {/* Lista de reglas */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-[#1e3a5f]">Reglas activas ({rules.filter((r) => r.isActive).length})</h2>
        </div>
        {loading && <p className="text-gray-400 text-sm p-6">Cargando...</p>}
        {!loading && rules.length === 0 && (
          <p className="text-gray-400 text-sm p-6">No hay reglas configuradas.</p>
        )}
        <div className="divide-y">
          {rules.map((rule) => (
            <div key={rule.id} className={`flex items-center gap-4 px-6 py-4 ${!rule.isActive ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-[#1e3a5f]">{rule.sourceAsset.name}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="font-semibold text-green-700">{rule.suggestedAsset.name}</span>
                  <span className="ml-2 text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    -{rule.discountPercent}%
                  </span>
                </p>
                {rule.label && <p className="text-xs text-gray-400 mt-0.5 truncate">{rule.label}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(rule)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium border transition-colors ${rule.isActive
                    ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                    : "border-green-300 text-green-700 hover:bg-green-50"}`}>
                  {rule.isActive ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => deleteRule(rule.id)}
                  className="text-xs px-3 py-1 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link en navbar admin */}
      <p className="text-xs text-gray-400 text-center">
        Accede también desde <span className="font-mono">/admin/upsell</span>
      </p>
    </div>
  );
}
