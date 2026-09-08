"use client";
import { useState, useEffect } from "react";

interface PackageOption { id: number; name: string }
interface GalleryVideoItem {
  id: number;
  youtubeId: string;
  title: string | null;
  eventType: string | null;
  packageAssetId: number | null;
  order: number;
  packageAsset: PackageOption | null;
}

const EVENT_TYPE_SUGGESTIONS = ["Boda", "XV Años", "Cumpleaños", "Evento Corporativo", "Bautizo", "Graduación"];

function SectionHeader({ label, title, desc }: { label: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p className="admin-label">{label}</p>
      <h2 className="admin-page-title" style={{ fontSize: "1.25rem" }}>{title}</h2>
      {desc && <p className="admin-page-desc">{desc}</p>}
    </div>
  );
}

export default function GalleryVideoManager() {
  const [videos,   setVideos]   = useState<GalleryVideoItem[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");

  const [url,            setUrl]            = useState("");
  const [title,          setTitle]          = useState("");
  const [eventType,      setEventType]      = useState("");
  const [packageAssetId, setPackageAssetId] = useState<string>("");

  const loadVideos = async () => {
    const r = await fetch("/api/admin/galeria/videos");
    const j = await r.json();
    setVideos(j.data ?? []);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/galeria/videos").then((r) => r.json()),
      fetch("/api/assets?rentable=true").then((r) => r.json()),
    ]).then(([videosJson, assetsJson]) => {
      setVideos(videosJson.data ?? []);
      const pkgs = (assetsJson.data ?? []).filter((a: { assetType: string }) => a.assetType === "package");
      setPackages(pkgs.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));
      setLoading(false);
    });
  }, []);

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/galeria/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url.trim(),
        title: title.trim() || undefined,
        eventType: eventType.trim() || undefined,
        packageAssetId: packageAssetId ? Number(packageAssetId) : null,
      }),
    });
    const j = await res.json();
    if (res.ok) {
      setMsg("✅ Video agregado.");
      setUrl(""); setTitle(""); setEventType(""); setPackageAssetId("");
      await loadVideos();
    } else {
      setMsg(`❌ ${j.error ?? "No se pudo agregar el video."}`);
    }
    setSaving(false);
  };

  const deleteVideo = async (v: GalleryVideoItem) => {
    if (!confirm(`¿Eliminar "${v.title ?? v.youtubeId}" de la galería? El video sigue existiendo en YouTube.`)) return;
    const res = await fetch(`/api/admin/galeria/videos/${v.id}`, { method: "DELETE" });
    if (res.ok) setVideos((prev) => prev.filter((x) => x.id !== v.id));
  };

  const move = async (v: GalleryVideoItem, dir: -1 | 1) => {
    const sorted = [...videos].sort((a, b) => a.order - b.order || a.id - b.id);
    const idx = sorted.findIndex((x) => x.id === v.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    setVideos((prev) => prev.map((x) => {
      if (x.id === a.id) return { ...x, order: b.order };
      if (x.id === b.id) return { ...x, order: a.order };
      return x;
    }));
    await Promise.all([
      fetch(`/api/admin/galeria/videos/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/galeria/videos/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ]);
  };

  if (loading) return <p className="text-sm" style={{ color: "#a1a1aa" }}>Cargando videos...</p>;

  const sortedVideos = [...videos].sort((a, b) => a.order - b.order || a.id - b.id);

  return (
    <section>
      <SectionHeader
        label="Galería"
        title="Videos"
        desc="Los videos se alojan en YouTube (no ocupan espacio en el sitio) — solo pega el link, marca el tipo de evento y el paquete contratado."
      />

      {/* Formulario alta */}
      <form onSubmit={addVideo} className="admin-surface" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
          <input
            className="aura-input"
            placeholder="Link de YouTube (youtube.com/watch?v=... o youtu.be/...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <input
            className="aura-input"
            placeholder="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="aura-input"
            list="event-type-suggestions"
            placeholder="Tipo de evento (opcional)"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
          <datalist id="event-type-suggestions">
            {EVENT_TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
          </datalist>
          <select
            className="aura-input"
            value={packageAssetId}
            onChange={(e) => setPackageAssetId(e.target.value)}
          >
            <option value="">Paquete contratado (opcional)</option>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button type="submit" disabled={saving} className="btn-gold text-sm disabled:opacity-50" style={{ padding: "0.6rem 1.5rem" }}>
            {saving ? "Agregando..." : "+ Agregar video"}
          </button>
          {msg && <span style={{ color: msg.startsWith("✅") ? "#22c55e" : "#ef4444", fontSize: "0.82rem", fontWeight: 600 }}>{msg}</span>}
        </div>
      </form>

      {/* Lista */}
      {sortedVideos.length === 0 ? (
        <p style={{ color: "#52525b", fontSize: "0.82rem" }}>Aún no hay videos.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {sortedVideos.map((v, i) => (
            <div key={v.id} className="admin-surface" style={{ overflow: "hidden" }}>
              <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                  alt={v.title ?? v.youtubeId}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <button onClick={() => deleteVideo(v)} title="Eliminar"
                  style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.85)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                  ×
                </button>
                <div style={{ position: "absolute", bottom: 6, right: 6, display: "flex", gap: "0.25rem" }}>
                  <button onClick={() => move(v, -1)} disabled={i === 0} title="Subir"
                    style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,.7)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", cursor: "pointer", opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={() => move(v, 1)} disabled={i === sortedVideos.length - 1} title="Bajar"
                    style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,.7)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", cursor: "pointer", opacity: i === sortedVideos.length - 1 ? 0.3 : 1 }}>↓</button>
                </div>
              </div>
              <div style={{ padding: "0.6rem 0.75rem" }}>
                <p style={{ color: "#e4e4e7", fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {v.title || "(sin título)"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.4rem" }}>
                  {v.eventType && (
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, background: "rgba(232,25,138,.12)", color: "var(--gold)" }}>
                      {v.eventType}
                    </span>
                  )}
                  {v.packageAsset && (
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, background: "rgba(124,58,237,.12)", color: "#a78bfa" }}>
                      {v.packageAsset.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
