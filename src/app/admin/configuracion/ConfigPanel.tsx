"use client";
import { useEffect, useState, useCallback } from "react";

interface Setting { key: string; value: string; updatedAt: string }

const SETTING_META: Record<string, { label: string; description: string; type: "number" | "text"; unit?: string }> = {
  payment_hold_hours: {
    label: "Ventana de pago (hold)",
    description: "Horas que una reserva permanece en estado 'pendiente de pago' antes de expirar automáticamente.",
    type: "number",
    unit: "horas",
  },
};

function getLabel(key: string) {
  return SETTING_META[key]?.label ?? key.replace(/_/g, " ");
}

export default function ConfigPanel() {
  const [settings, setSettings]   = useState<Setting[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState<string | null>(null);
  const [drafts,   setDrafts]     = useState<Record<string, string>>({});
  const [toast,    setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/settings");
    const json = await res.json();
    const data: Setting[] = json.data ?? [];
    setSettings(data);
    const initial: Record<string, string> = {};
    for (const s of data) initial[s.key] = s.value;
    setDrafts(initial);
    setLoading(false);
  }, []);

  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => { load(); }, [load]);

  const save = async (key: string) => {
    setSaving(key);
    const res  = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: drafts[key] }),
    });
    if (res.ok) {
      showToast(`✓ "${getLabel(key)}" actualizado`, true);
      await load();
    } else {
      showToast("Error al guardar", false);
    }
    setSaving(null);
  };

  const changed = (key: string) =>
    settings.find((s) => s.key === key)?.value !== drafts[key];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div role="status" style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          padding: "0.75rem 1.25rem", borderRadius: 12, fontSize: "0.85rem",
          fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,.5)",
          background: toast.ok ? "rgba(22,163,74,.9)" : "rgba(239,68,68,.9)",
          color: "#fff", backdropFilter: "blur(8px)",
        }}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-4">
        {settings.map((s) => {
          const meta    = SETTING_META[s.key];
          const isDirty = changed(s.key);
          return (
            <div key={s.key} className="aura-card p-5">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p className="font-black text-white text-sm mb-0.5">{getLabel(s.key)}</p>
                  {meta?.description && (
                    <p style={{ color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.5 }}>{meta.description}</p>
                  )}
                  <p style={{ color: "#334155", fontSize: "0.68rem", marginTop: "0.35rem" }}>
                    Clave: <code style={{ color: "#475569" }}>{s.key}</code> ·
                    Actualizado: {new Date(s.updatedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <input
                      type={meta?.type ?? "text"}
                      value={drafts[s.key] ?? s.value}
                      onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                      className="aura-input"
                      style={{ width: meta?.type === "number" ? 96 : 200, textAlign: meta?.type === "number" ? "center" : "left" }}
                      aria-label={getLabel(s.key)}
                    />
                    {meta?.unit && (
                      <span style={{ color: "#475569", fontSize: "0.8rem" }}>{meta.unit}</span>
                    )}
                  </div>
                  <button
                    onClick={() => save(s.key)}
                    disabled={saving === s.key || !isDirty}
                    className="btn-gold disabled:opacity-40"
                    style={{ padding: "0.5rem 1.25rem", fontSize: "0.78rem" }}>
                    {saving === s.key ? "..." : "Guardar"}
                  </button>
                  {isDirty && (
                    <button
                      onClick={() => setDrafts((d) => ({ ...d, [s.key]: s.value }))}
                      style={{ color: "#475569", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer" }}
                      title="Descartar cambios">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ color: "#334155", fontSize: "0.72rem", marginTop: "1.5rem" }}>
        Para agregar nuevos parámetros al sistema, ejecuta en la base de datos:<br />
        <code style={{ color: "#475569" }}>INSERT INTO system_settings (key, value) VALUES (&apos;mi_clave&apos;, &apos;valor&apos;);</code>
      </p>
    </div>
  );
}
