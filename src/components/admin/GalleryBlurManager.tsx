"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface Region { x: number; y: number; w: number; h: number }
interface GalleryImage {
  name: string; original: string; webp: string | null;
  regions: Region[]; processed: boolean; inCarousel: boolean;
}

// ── Sección header reutilizable ────────────────────────────────────────────
function SectionHeader({ label, title, desc }: { label: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p className="admin-label">{label}</p>
      <h2 className="admin-page-title" style={{ fontSize: "1.25rem" }}>{title}</h2>
      {desc && <p className="admin-page-desc">{desc}</p>}
    </div>
  );
}

export default function GalleryBlurManager() {
  const [images,        setImages]        = useState<GalleryImage[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState<GalleryImage | null>(null);
  const [regions,       setRegions]       = useState<Region[]>([]);
  const [drawing,       setDrawing]       = useState(false);
  const [startPt,       setStartPt]       = useState({ x: 0, y: 0 });
  const [currentR,      setCurrentR]      = useState<Region | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [carouselSelected, setCarouselSelected] = useState<Set<string>>(new Set());
  const [carouselSaving,   setCarouselSaving]   = useState(false);
  const [msg,           setMsg]           = useState<string>("");
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetch("/api/admin/galeria")
      .then((r) => r.json())
      .then((j) => {
        const data: GalleryImage[] = j.data ?? [];
        setImages(data);
        setCarouselSelected(new Set(data.filter((img) => img.inCarousel).map((img) => img.name)));
        setLoading(false);
      });
  }, []);

  // ── Editor de difuminado ──────────────────────────────────────────────────
  const openEditor = (img: GalleryImage) => {
    setEditing(img);
    setRegions([...img.regions]);
    setMsg("");
  };

  const getRelativePos = (e: React.MouseEvent | React.TouchEvent) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect    = img.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top)  / rect.height)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    const pos = getRelativePos(e);
    setStartPt(pos);
    setDrawing(true);
    setCurrentR({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getRelativePos(e);
    setCurrentR({
      x: Math.min(startPt.x, pos.x), y: Math.min(startPt.y, pos.y),
      w: Math.abs(pos.x - startPt.x),  h: Math.abs(pos.y - startPt.y),
    });
  };

  const onMouseUp = () => {
    if (drawing && currentR && currentR.w > 0.02 && currentR.h > 0.02) {
      setRegions((prev) => [...prev, currentR]);
    }
    setDrawing(false);
    setCurrentR(null);
  };

  const removeRegion = (i: number) => setRegions((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!editing) return;
    setSaving(true); setMsg("");
    const res  = await fetch("/api/admin/galeria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: editing.name, regions }),
    });
    const json = await res.json();
    if (res.ok) {
      setMsg("✅ Difuminado guardado y publicado.");
      // Recargar lista para reflejar estado actualizado
      const r = await fetch("/api/admin/galeria");
      const j = await r.json();
      const data: GalleryImage[] = j.data ?? [];
      setImages(data);
      setCarouselSelected(new Set(data.filter((img) => img.inCarousel).map((img) => img.name)));
      setEditing((e) => e ? { ...e, regions } : e);
      setTimeout(() => setEditing(null), 1500);
    } else {
      setMsg(`❌ Error: ${json.error ?? "No se pudo procesar la imagen."}`);
    }
    setSaving(false);
  };

  const deleteImage = async (img: GalleryImage) => {
    if (!confirm(`¿Eliminar "${img.name}"?\nTambién se eliminará del carrusel. Esta acción no se puede deshacer.`)) return;
    const res = await fetch("/api/admin/galeria", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: img.name }),
    });
    if (res.ok) {
      setImages((prev) => prev.filter((i) => i.name !== img.name));
      setCarouselSelected((prev) => { const next = new Set(prev); next.delete(img.name); return next; });
    }
  };

  // ── Subida ────────────────────────────────────────────────────────────────
  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true); setMsg("");
    let count = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/galeria", { method: "PATCH", body: fd });
      if (res.ok) count++;
    }
    const r = await fetch("/api/admin/galeria");
    const j = await r.json();
    const data: GalleryImage[] = j.data ?? [];
    setImages(data);
    setCarouselSelected(new Set(data.filter((img) => img.inCarousel).map((img) => img.name)));
    setMsg(`✅ ${count} imagen${count !== 1 ? "es" : ""} subida${count !== 1 ? "s" : ""} correctamente.`);
    setUploading(false);
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true); setMsg("");
    const res  = await fetch("/api/admin/galeria", { method: "PUT" });
    const json = await res.json();
    if (res.ok) {
      setMsg(`✅ ${json.data.processed} imágenes actualizadas. Recargando...`);
      setTimeout(async () => {
        const r = await fetch("/api/admin/galeria");
        const j = await r.json();
        setImages(j.data ?? []);
        setMsg(`✅ Galería actualizada (${json.data.processed} imágenes).`);
        setRefreshing(false);
      }, 1500);
    } else {
      setMsg("❌ Error al actualizar. Intenta de nuevo.");
      setRefreshing(false);
    }
  }, []);

  // ── Carrusel ──────────────────────────────────────────────────────────────
  const toggleCarousel = (name: string) => {
    setCarouselSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const saveCarousel = async () => {
    setCarouselSaving(true);
    const res = await fetch("/api/admin/galeria/carousel", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: [...carouselSelected] }),
    });
    if (res.ok) {
      setMsg(`✅ Carrusel actualizado — ${carouselSelected.size} imagen${carouselSelected.size !== 1 ? "es" : ""}.`);
      setImages((prev) => prev.map((img) => ({ ...img, inCarousel: carouselSelected.has(img.name) })));
    } else {
      setMsg("❌ Error al guardar el carrusel.");
    }
    setCarouselSaving(false);
  };

  if (loading) return <p className="text-sm" style={{ color: "#94a3b8" }}>Cargando imágenes...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>

      {/* ══════════════════════════════════════════════════════
          SECCIÓN 1 — GALERÍA DEL SITIO
      ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Galería"
          title="Galería del sitio"
          desc="Sube fotos y marca zonas con rostros para difuminarlas antes de publicarlas."
        />

        {/* Subir fotos */}
        <div className="admin-surface" style={{ padding: "1.25rem", marginBottom: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ color: "#e4e4e7", fontWeight: 500, fontSize: "0.875rem", marginBottom: "0.2rem" }}>Agregar fotos al carrusel</p>
            <p style={{ color: "#71717a", fontSize: "0.78rem" }}>JPG, PNG o WebP · Se agregan al inicio (más recientes primero)</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            {msg.includes("subida") && <span style={{ color: "#22c55e", fontSize: "0.82rem", fontWeight: 600 }}>{msg}</span>}
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => uploadFiles(e.target.files)} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="btn-gold text-sm disabled:opacity-50"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.25rem" }}>
              {uploading ? "Subiendo..." : "📤 Subir fotos"}
            </button>
          </div>
        </div>

        {/* Reprocesar todo */}
        <div className="admin-surface" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ color: "#e4e4e7", fontWeight: 500, fontSize: "0.875rem", marginBottom: "0.2rem" }}>Publicar cambios en el sitio</p>
            <p style={{ color: "#71717a", fontSize: "0.78rem" }}>Reprocesa todas las imágenes con las zonas guardadas.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {msg && !msg.includes("subida") && !msg.includes("Carrusel") && (
              <span style={{ color: msg.startsWith("✅") ? "#22c55e" : "#ef4444", fontSize: "0.82rem", fontWeight: 600 }}>{msg}</span>
            )}
            <button onClick={refreshAll} disabled={refreshing}
              className="btn-gold text-sm disabled:opacity-50"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.25rem" }}>
              {refreshing ? "⟳ Procesando..." : "🔄 Actualizar galería en el sitio"}
            </button>
          </div>
        </div>

        {/* Grid de imágenes — editor de difuminado */}
        <p style={{ color: "#52525b", fontSize: "0.75rem", marginBottom: "0.75rem" }}>
          Haz clic en una imagen para abrir el editor y marcar las zonas a difuminar.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
          {images.map((img) => (
            <div key={img.name}
              style={{
                position: "relative", borderRadius: 8, overflow: "hidden",
                aspectRatio: "4/3", cursor: "pointer",
                border: img.regions.length > 0 ? "2px solid #9333ea" : "2px solid rgba(255,255,255,.08)",
                transition: "transform 0.15s",
              }}
              onClick={() => openEditor(img)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.original} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

              {/* Botón eliminar */}
              <button onClick={(e) => { e.stopPropagation(); deleteImage(img); }}
                title="Eliminar imagen"
                style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.85)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, lineHeight: 1 }}>
                ×
              </button>

              {img.regions.length > 0 && (
                <div style={{ position: "absolute", top: 6, right: 6, background: "#9333ea", color: "#fff", borderRadius: 999, fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px" }}>
                  {img.regions.length} zona{img.regions.length > 1 ? "s" : ""} 🔵
                </div>
              )}
              {img.regions.length === 0 && (
                <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,.6)", color: "#94a3b8", borderRadius: 999, fontSize: "0.6rem", padding: "2px 7px" }}>
                  Sin difuminar
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.78rem" }}>✏️ Editar difuminado</span>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,.8),transparent)", padding: "0.4rem 0.5rem" }}>
                <p style={{ color: "#fff", fontSize: "0.62rem", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{img.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divisor */}
      <hr className="admin-divider" style={{ margin: 0 }} />

      {/* ══════════════════════════════════════════════════════
          SECCIÓN 2 — CARRUSEL DEL INICIO
      ══════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          label="Carrusel"
          title="Carrusel del inicio"
          desc="Elige qué imágenes aparecen en el carrusel de la página principal. Haz clic para activar o desactivar cada foto."
        />

        {/* Barra de acción */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{
              background: carouselSelected.size > 0 ? "rgba(232,25,138,.15)" : "rgba(255,255,255,.04)",
              border: `1px solid ${carouselSelected.size > 0 ? "rgba(232,25,138,.4)" : "rgba(255,255,255,.08)"}`,
              color: carouselSelected.size > 0 ? "var(--gold)" : "#52525b",
              padding: "0.3rem 0.85rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
            }}>
              {carouselSelected.size} imagen{carouselSelected.size !== 1 ? "es" : ""} seleccionada{carouselSelected.size !== 1 ? "s" : ""}
            </span>
            {carouselSelected.size > 0 && (
              <button onClick={() => setCarouselSelected(new Set())}
                style={{ background: "none", border: "none", color: "#71717a", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}>
                Quitar todas
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {msg.includes("Carrusel") && (
              <span style={{ color: msg.startsWith("✅") ? "#22c55e" : "#ef4444", fontSize: "0.82rem", fontWeight: 600 }}>{msg}</span>
            )}
            <button onClick={saveCarousel} disabled={carouselSaving}
              className="btn-gold text-sm disabled:opacity-50"
              style={{ padding: "0.5rem 1.5rem" }}>
              {carouselSaving ? "Guardando..." : "✓ Guardar carrusel"}
            </button>
          </div>
        </div>

        {/* Grid de selección */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
          {images.map((img) => {
            const selected = carouselSelected.has(img.name);
            return (
              <div key={img.name} onClick={() => toggleCarousel(img.name)}
                style={{
                  position: "relative", borderRadius: 8, overflow: "hidden",
                  aspectRatio: "4/3", cursor: "pointer",
                  border: selected ? "2px solid var(--gold)" : "2px solid rgba(255,255,255,.08)",
                  boxShadow: selected ? "0 0 0 1px rgba(232,25,138,.3), inset 0 0 0 1px rgba(232,25,138,.2)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                  opacity: selected ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
                  if (!selected) (e.currentTarget as HTMLDivElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  if (!selected) (e.currentTarget as HTMLDivElement).style.opacity = "0.6";
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.original} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

                {/* Check badge */}
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  width: 22, height: 22, borderRadius: "50%",
                  background: selected ? "var(--gold)" : "rgba(0,0,0,.55)",
                  border: selected ? "2px solid rgba(255,255,255,.5)" : "2px solid rgba(255,255,255,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 700, color: selected ? "#05051a" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                }}>
                  ✓
                </div>

                {/* Label */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,.85),transparent)", padding: "0.5rem 0.5rem 0.35rem" }}>
                  <p style={{ color: "#fff", fontSize: "0.62rem", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{img.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── EDITOR MODAL (blur) ──────────────────────────────────────────────── */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: 900, background: "#05051a", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(232,25,138,.3)" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#fff", fontWeight: 700 }}>{editing.name}</p>
                <p style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Arrastra sobre los rostros para difuminarlos. Clic en × para quitar una zona.</p>
              </div>
              <button onClick={() => setEditing(null)} style={{ color: "#ef4444", background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            <div ref={containerRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              style={{ background: "#000", display: "flex", justifyContent: "center", alignItems: "center", userSelect: "none", cursor: "crosshair", maxHeight: "62vh", overflow: "hidden" }}>
              <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={editing.original} alt={editing.name} draggable={false}
                  style={{ display: "block", maxHeight: "60vh", maxWidth: "100%", pointerEvents: "none" }} />

                {regions.map((r, i) => (
                  <div key={i} style={{ position: "absolute", left: `${r.x*100}%`, top: `${r.y*100}%`, width: `${r.w*100}%`, height: `${r.h*100}%`, background: "rgba(124,58,237,.4)", border: "2px solid #c084fc", backdropFilter: "blur(6px)", boxSizing: "border-box", zIndex: 10 }}>
                    <button onClick={(e) => { e.stopPropagation(); removeRegion(i); }}
                      style={{ position: "absolute", top: -11, right: -11, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "2px solid #fff", fontSize: "0.8rem", cursor: "pointer", lineHeight: "18px", textAlign: "center", zIndex: 20 }}>×</button>
                    <span style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: "0.6rem", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,.9)", whiteSpace: "nowrap", background: "rgba(0,0,0,.5)", padding: "1px 6px", borderRadius: 4 }}>zona {i + 1}</span>
                  </div>
                ))}

                {drawing && currentR && currentR.w > 0.005 && currentR.h > 0.005 && (
                  <div style={{ position: "absolute", left: `${currentR.x*100}%`, top: `${currentR.y*100}%`, width: `${currentR.w*100}%`, height: `${currentR.h*100}%`, background: "rgba(56,189,248,.2)", border: "2px dashed #38bdf8", boxSizing: "border-box", pointerEvents: "none", zIndex: 10 }} />
                )}

                {regions.length === 0 && !drawing && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ background: "rgba(0,0,0,.7)", padding: "0.75rem 1.25rem", borderRadius: 10, textAlign: "center" }}>
                      <p style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 700 }}>🖱️ Arrastra sobre los rostros para difuminarlos</p>
                      <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: "0.2rem" }}>Puedes marcar varias zonas</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button onClick={() => setRegions([])} className="text-sm font-bold px-4 py-2 rounded-lg border"
                  style={{ borderColor: "rgba(239,68,68,.4)", color: "#ef4444", background: "rgba(239,68,68,.08)" }}>
                  🗑 Quitar todo
                </button>
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: "2.2rem" }}>
                  {regions.length} zona{regions.length !== 1 ? "s" : ""} marcada{regions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {msg && <span style={{ color: msg.startsWith("✅") ? "#22c55e" : "#ef4444", fontSize: "0.85rem", fontWeight: 700 }}>{msg}</span>}
                <button onClick={save} disabled={saving} className="btn-gold text-sm px-6 py-2.5 disabled:opacity-50">
                  {saving ? "Procesando..." : "✓ Aplicar y guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
