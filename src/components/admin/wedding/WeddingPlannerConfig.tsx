"use client";
import { useState } from "react";
import { Plus, Trash2, Loader2, FolderOpen, CheckCircle2, AlertCircle } from "lucide-react";

interface Testimonial { name: string; eventType: string; text: string }
interface Step { title: string; desc: string }

interface WpSettings {
  wp_event_types: string[];
  wp_gallery_images: string[];
  wp_testimonials: Testimonial[];
  wp_hero_subtitle: string;
  wp_hero_image: string | null;
  wp_steps: Step[];
}

interface Props { initial: WpSettings }

export function WeddingPlannerConfig({ initial }: Props) {
  const [settings, setSettings] = useState<WpSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleDriveImport() {
    if (!driveUrl.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/wedding-planner/drive-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderUrl: driveUrl }),
      });
      let data: { data?: { count: number; images: string[] }; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(`Error ${res.status} — respuesta inválida del servidor`);
      }
      if (!res.ok) throw new Error(data.error ?? "Error al importar");
      const { count, images } = data.data!;
      setSettings((s) => ({ ...s, wp_gallery_images: images }));
      setImportResult({ ok: true, msg: `✓ ${count} fotos importadas. Pulsa "Guardar configuración" para aplicar.` });
      setDriveUrl("");
    } catch (e) {
      setImportResult({ ok: false, msg: e instanceof Error ? e.message : "Error al importar" });
    } finally {
      setImporting(false);
    }
  }

  function normalizeDriveUrl(url: string): string {
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch && url.includes("drive.google.com")) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
    return url;
  }

  function setField<K extends keyof WpSettings>(key: K, value: WpSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/admin/wedding-planner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Foto del hero */}
      <section>
        <h3 className="font-medium mb-2" style={{ color: "var(--cream)" }}>Foto de fondo del hero</h3>
        {settings.wp_hero_image && (
          <img
            src={settings.wp_hero_image}
            alt="Hero actual"
            style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: "0.5rem", marginBottom: "0.75rem" }}
          />
        )}
        <input
          className="aura-input w-full"
          placeholder="https://... (URL de la imagen)"
          value={settings.wp_hero_image ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setSettings((s) => ({ ...s, wp_hero_image: val ? normalizeDriveUrl(val) : null }));
          }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Pega una URL directa de imagen. Recomendado: 1920×1080px o mayor.
        </p>
      </section>

      {/* Hero subtitle */}
      <section>
        <h3 className="font-medium mb-2" style={{ color: "var(--cream)" }}>Subtítulo del hero</h3>
        <input
          className="aura-input w-full"
          value={settings.wp_hero_subtitle}
          onChange={(e) => setField("wp_hero_subtitle", e.target.value)}
        />
      </section>

      {/* Tipos de evento */}
      <section>
        <h3 className="font-medium mb-2" style={{ color: "var(--cream)" }}>
          Tipos de evento (texto animado)
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings.wp_event_types.map((t, i) => (
            <span
              key={i}
              className="admin-badge flex items-center gap-1"
              style={{ background: "rgba(232,25,138,0.12)", color: "var(--gold)", border: "1px solid rgba(232,25,138,0.25)" }}
            >
              {t}
              <button
                onClick={() =>
                  setField("wp_event_types", settings.wp_event_types.filter((_, j) => j !== i))
                }
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
              >
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="wp-new-type"
            className="aura-input flex-1"
            placeholder="Nuevo tipo..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && !settings.wp_event_types.includes(val)) {
                  setField("wp_event_types", [...settings.wp_event_types, val]);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <button
            className="btn-ghost px-3 py-2 text-sm rounded-lg flex items-center gap-1"
            onClick={() => {
              const input = document.getElementById("wp-new-type") as HTMLInputElement;
              const val = input.value.trim();
              if (val && !settings.wp_event_types.includes(val)) {
                setField("wp_event_types", [...settings.wp_event_types, val]);
                input.value = "";
              }
            }}
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </section>

      {/* Galería */}
      <section>
        <h3 className="font-medium mb-1" style={{ color: "var(--cream)" }}>
          Fotos de la galería
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Importa automáticamente desde una carpeta de Google Drive, o pega URLs directas manualmente.
        </p>

        {/* ── Importar desde Drive ── */}
        <div className="admin-surface rounded-xl p-4 mb-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: "var(--cream)" }}>
            <FolderOpen size={15} style={{ color: "var(--gold)" }} />
            Importar desde carpeta de Google Drive
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            La carpeta debe estar compartida como <strong style={{ color: "var(--cream)" }}>"Cualquier persona con el enlace puede ver"</strong>.
          </p>
          <div className="flex gap-2">
            <input
              className="aura-input flex-1 text-sm"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDriveImport()}
            />
            <button
              onClick={handleDriveImport}
              disabled={importing || !driveUrl.trim()}
              className="btn-gold px-4 py-2 text-sm rounded-lg flex items-center gap-2"
              style={{ flexShrink: 0 }}
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
              {importing ? "Importando..." : "Importar"}
            </button>
          </div>
          {importResult && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: importResult.ok ? "#22c55e" : "var(--red)" }}>
              {importResult.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {importResult.msg}
            </p>
          )}
        </div>

        {/* ── URLs manuales ── */}
        {settings.wp_gallery_images.length > 0 && (
          <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
            {settings.wp_gallery_images.length} fotos en la galería · También puedes editarlas manualmente:
          </p>
        )}
        <textarea
          className="aura-input w-full font-mono text-xs"
          rows={4}
          value={settings.wp_gallery_images.join("\n")}
          onChange={(e) =>
            setField(
              "wp_gallery_images",
              e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
            )
          }
          placeholder="O pega URLs directas de imagen (una por línea)"
          style={{ resize: "vertical" }}
        />
      </section>

      {/* Testimonios */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium" style={{ color: "var(--cream)" }}>Testimonios</h3>
          <button
            className="btn-ghost px-3 py-1 text-xs rounded-lg flex items-center gap-1"
            onClick={() =>
              setField("wp_testimonials", [
                ...settings.wp_testimonials,
                { name: "", eventType: "", text: "" },
              ])
            }
          >
            <Plus size={13} /> Agregar
          </button>
        </div>
        <div className="space-y-4">
          {settings.wp_testimonials.map((t, i) => (
            <div key={i} className="admin-surface rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  Testimonio {i + 1}
                </p>
                <button
                  onClick={() =>
                    setField("wp_testimonials", settings.wp_testimonials.filter((_, j) => j !== i))
                  }
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {(["name", "eventType", "text"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                    {field === "name" ? "Nombre" : field === "eventType" ? "Tipo de evento" : "Texto"}
                  </label>
                  {field === "text" ? (
                    <textarea
                      className="aura-input w-full text-sm"
                      rows={3}
                      value={t[field]}
                      onChange={(e) => {
                        const updated = [...settings.wp_testimonials];
                        updated[i] = { ...updated[i], [field]: e.target.value };
                        setField("wp_testimonials", updated);
                      }}
                    />
                  ) : (
                    <input
                      className="aura-input w-full text-sm"
                      value={t[field]}
                      onChange={(e) => {
                        const updated = [...settings.wp_testimonials];
                        updated[i] = { ...updated[i], [field]: e.target.value };
                        setField("wp_testimonials", updated);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Pasos */}
      <section>
        <h3 className="font-medium mb-3" style={{ color: "var(--cream)" }}>Pasos "¿Cómo funciona?"</h3>
        <div className="space-y-3">
          {settings.wp_steps.map((step, i) => (
            <div key={i} className="admin-surface rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Paso {i + 1}</p>
              {(["title", "desc"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                    {field === "title" ? "Título" : "Descripción"}
                  </label>
                  <input
                    className="aura-input w-full text-sm"
                    value={step[field]}
                    onChange={(e) => {
                      const updated = [...settings.wp_steps];
                      updated[i] = { ...updated[i], [field]: e.target.value };
                      setField("wp_steps", updated);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-gold px-8 py-3 rounded-lg text-sm"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" /> Guardando...
          </span>
        ) : saved ? "¡Guardado!" : "Guardar configuración"}
      </button>
    </div>
  );
}
