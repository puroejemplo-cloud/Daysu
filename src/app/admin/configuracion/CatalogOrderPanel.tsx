"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Category { id: number; name: string }

function buildOrdered(cats: Category[], order: number[]): Category[] {
  if (!order.length) return [...cats];
  const ordered = order.map((id) => cats.find((c) => c.id === id)).filter(Boolean) as Category[];
  const inOrder = new Set(order);
  const rest = cats.filter((c) => !inOrder.has(c.id));
  return [...ordered, ...rest];
}

export default function CatalogOrderPanel({
  categories,
  initialOrder,
}: {
  categories: Category[];
  initialOrder: number[];
}) {
  const [ordered, setOrdered] = useState<Category[]>(() => buildOrdered(categories, initialOrder));
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const move = (idx: number, dir: -1 | 1) => {
    const next   = [...ordered];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrdered(next);
  };

  const save = async () => {
    setSaving(true);
    const ids = ordered.map((c) => c.id);
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ key: "catalog_category_order", value: JSON.stringify(ids) }),
    });
    setMsg(res.ok ? "✓ Orden guardado" : "❌ Error al guardar");
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const reset = () => {
    const alpha = [...categories].sort((a, b) => a.name.localeCompare(b.name, "es"));
    setOrdered(alpha);
    fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ key: "catalog_category_order", value: "[]" }),
    }).then(() => {
      setMsg("✓ Orden restablecido (alfabético)");
      setTimeout(() => setMsg(""), 3000);
    });
  };

  return (
    <div className="admin-surface" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <p style={{ color: "#e4e4e7", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.2rem" }}>
            Orden de categorías
          </p>
          <p style={{ color: "#71717a", fontSize: "0.78rem", lineHeight: 1.5 }}>
            Arrastra con las flechas para cambiar el orden en el catálogo público.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {msg && (
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}>
              {msg}
            </span>
          )}
          <button onClick={reset}
            className="px-3 py-2 rounded-md text-xs font-semibold transition-all"
            style={{ background: "transparent", color: "#52525b", border: "1px solid rgba(255,255,255,0.07)" }}>
            Restablecer
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-md text-xs font-semibold disabled:opacity-30 transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.1)" }}>
            {saving ? "Guardando…" : "Guardar orden"}
          </button>
        </div>
      </div>

      {/* Lista ordenable */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {ordered.map((cat, i) => (
          <div key={cat.id}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.55rem 0.875rem", borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "border-color 0.15s",
            }}>
            {/* Número de posición */}
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#3f3f46", width: 18, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
              {i + 1}
            </span>
            {/* Nombre */}
            <span style={{ flex: 1, fontSize: "0.82rem", color: "#e4e4e7" }}>
              {cat.name}
            </span>
            {/* Controles */}
            <div style={{ display: "flex", gap: "0.2rem" }}>
              <button
                onClick={() => move(i, -1)} disabled={i === 0}
                aria-label={`Subir ${cat.name}`}
                style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: i === 0 ? "#27272a" : "#a1a1aa", cursor: i === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronUp size={13} />
              </button>
              <button
                onClick={() => move(i, 1)} disabled={i === ordered.length - 1}
                aria-label={`Bajar ${cat.name}`}
                style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: i === ordered.length - 1 ? "#27272a" : "#a1a1aa", cursor: i === ordered.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronDown size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
