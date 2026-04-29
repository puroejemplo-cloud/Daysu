"use client";
import { useState } from "react";

interface Pkg { id: number; name: string; sku: string; dailyRate: string }

export default function HomepagePackagesPanel({
  packages,
  initialSelected,
}: {
  packages: Pkg[];
  initialSelected: number[];
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialSelected));
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    const ids = [...selected];
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "homepage_packages", value: JSON.stringify(ids) }),
    });
    setMsg(res.ok
      ? ids.length === 0
        ? "✓ Mostrando todos los paquetes"
        : `✓ ${ids.length} paquete${ids.length !== 1 ? "s" : ""} guardado${ids.length !== 1 ? "s" : ""}`
      : "❌ Error al guardar");
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="admin-surface" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <p style={{ color: "#e4e4e7", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.2rem" }}>
            Paquetes en el inicio
          </p>
          <p style={{ color: "#71717a", fontSize: "0.78rem", lineHeight: 1.5 }}>
            Elige qué paquetes aparecen en la página principal. Sin selección = se muestran todos.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {msg && (
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}>
              {msg}
            </span>
          )}
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-md text-xs font-semibold disabled:opacity-30 transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.1)" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
        <button onClick={() => setSelected(new Set(packages.map((p) => p.id)))}
          style={{ fontSize: "0.72rem", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Seleccionar todos
        </button>
        <span style={{ color: "#3f3f46", fontSize: "0.72rem" }}>·</span>
        <button onClick={() => setSelected(new Set())}
          style={{ fontSize: "0.72rem", color: "#52525b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Limpiar (mostrar todos)
        </button>
        <span style={{ color: "#3f3f46", fontSize: "0.72rem" }}>·</span>
        <span style={{ fontSize: "0.72rem", color: "#52525b" }}>
          {selected.size === 0
            ? "Mostrando todos"
            : `${selected.size} de ${packages.length} seleccionados`}
        </span>
      </div>

      {/* Lista de paquetes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {packages.map((pkg) => {
          const on = selected.has(pkg.id);
          return (
            <label key={pkg.id}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.6rem 0.875rem", borderRadius: 8, cursor: "pointer",
                background: on ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${on ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.15s",
              }}>
              <input type="checkbox" checked={on} onChange={() => toggle(pkg.id)}
                style={{ accentColor: "var(--gold)", width: 15, height: 15, flexShrink: 0, cursor: "pointer" }} />
              <span style={{ flex: 1, fontSize: "0.82rem", color: on ? "#e4e4e7" : "#71717a", fontWeight: on ? 500 : 400 }}>
                {pkg.name}
              </span>
              <span style={{ fontSize: "0.68rem", color: "#3f3f46", fontFamily: "mono" }}>
                ${Number(pkg.dailyRate).toLocaleString("es-MX")} MXN
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
