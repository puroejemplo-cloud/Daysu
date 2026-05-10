"use client";
import { useEffect, useState, useCallback } from "react";

interface Setting { key: string; value: string; updatedAt: string }

interface SettingMeta {
  label: string;
  description: string;
  type: "number" | "text" | "textarea";
  unit?: string;
  placeholder?: string;
}

const SETTING_META: Record<string, SettingMeta> = {
  deposit_percent: {
    label: "Porcentaje de anticipo",
    description: "Porcentaje del total que el cliente debe pagar como depósito para confirmar su reserva. Se muestra en el wizard de reserva y en el ticket de confirmación.",
    type: "number",
    unit: "%",
    placeholder: "30",
  },
  payment_hold_hours: {
    label: "Ventana de pago (hold)",
    description: "Horas que una reserva permanece en estado 'pendiente de pago' antes de expirar automáticamente.",
    type: "number",
    unit: "horas",
  },
  whatsapp_number: {
    label: "Número de WhatsApp",
    description: "Número de teléfono para el botón flotante (formato internacional sin + ni espacios).",
    type: "text",
    placeholder: "524929496372",
  },
  whatsapp_message: {
    label: "Mensaje predeterminado de WhatsApp",
    description: "Texto que se pre-llena al abrir WhatsApp desde el botón flotante.",
    type: "textarea",
    placeholder: "Hola, me interesa cotizar un paquete para mi evento 🎉",
  },
};

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
    // Inicializa drafts para TODOS los keys de SETTING_META, luego sobreescribe con valores de BD
    const initial: Record<string, string> = {};
    for (const key of Object.keys(SETTING_META)) initial[key] = "";
    for (const s of data) initial[s.key] = s.value;
    setDrafts(initial);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (key: string) => {
    setSaving(key);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: drafts[key] }),
    });
    if (res.ok) {
      showToast(`✓ "${SETTING_META[key]?.label ?? key}" actualizado`, true);
      await load();
    } else {
      showToast("Error al guardar", false);
    }
    setSaving(null);
  };

  const dbValue = (key: string) => settings.find((s) => s.key === key)?.value ?? "";
  const changed  = (key: string) => dbValue(key) !== drafts[key];
  const updatedAt = (key: string) => {
    const s = settings.find(x => x.key === key);
    return s ? new Date(s.updatedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : null;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          padding: "0.6rem 1rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
          background: toast.ok ? "#14532d" : "#450a0a",
          border: `1px solid ${toast.ok ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)"}`,
          color: toast.ok ? "#86efac" : "#fca5a5",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(SETTING_META).map(([key, meta]) => {
          const isDirty = changed(key);
          const when    = updatedAt(key);
          return (
            <div key={key} className="admin-surface" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ color: "#e4e4e7", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.2rem" }}>{meta.label}</p>
                  <p style={{ color: "#71717a", fontSize: "0.78rem", lineHeight: 1.5 }}>{meta.description}</p>
                  <p className="admin-label" style={{ marginTop: "0.35rem" }}>
                    {key}{when ? ` · actualizado ${when}` : " · sin configurar"}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {meta.type === "textarea" ? (
                      <textarea
                        value={drafts[key] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                        placeholder={meta.placeholder}
                        rows={3}
                        className="aura-input"
                        style={{ width: 280, resize: "vertical", fontSize: "0.82rem" }}
                        aria-label={meta.label}
                      />
                    ) : (
                      <input
                        type={meta.type}
                        value={drafts[key] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                        placeholder={meta.placeholder}
                        className="aura-input"
                        style={{ width: meta.type === "number" ? 88 : 220, textAlign: meta.type === "number" ? "center" : "left" }}
                        aria-label={meta.label}
                      />
                    )}
                    {meta.unit && (
                      <span className="admin-label">{meta.unit}</span>
                    )}
                  </div>
                  <button
                    onClick={() => save(key)}
                    disabled={saving === key || !isDirty}
                    className="px-4 py-2 rounded-md text-xs font-semibold disabled:opacity-30 transition-all"
                    style={{ background: isDirty ? "rgba(255,255,255,0.08)" : "transparent", color: isDirty ? "#e4e4e7" : "#3f3f46", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {saving === key ? "..." : "Guardar"}
                  </button>
                  {isDirty && (
                    <button
                      onClick={() => setDrafts((d) => ({ ...d, [key]: dbValue(key) }))}
                      title="Descartar"
                      style={{ color: "#52525b", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer" }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
