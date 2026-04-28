"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface Region { x: number; y: number; w: number; h: number }
interface GalleryImage {
  name: string; original: string; webp: string;
  regions: Region[]; processed: boolean;
}

export default function GalleryBlurManager() {
  const [images,    setImages]    = useState<GalleryImage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<GalleryImage | null>(null);
  const [regions,   setRegions]   = useState<Region[]>([]);
  const [drawing,   setDrawing]   = useState(false);
  const [startPt,   setStartPt]   = useState({ x: 0, y: 0 });
  const [currentR,  setCurrentR]  = useState<Region | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetch("/api/admin/galeria")
      .then((r) => r.json())
      .then((j) => { setImages(j.data ?? []); setLoading(false); });
  }, []);

  const openEditor = (img: GalleryImage) => {
    setEditing(img);
    setRegions([...img.regions]);
    setMsg("");
  };

  const getRelativePos = (e: React.MouseEvent | React.TouchEvent) => {
    // Usar la imagen real (no el contenedor) para coordenadas precisas
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect   = img.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top)  / rect.height)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    // Ignorar clics en botones × de las zonas existentes
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
      x: Math.min(startPt.x, pos.x),
      y: Math.min(startPt.y, pos.y),
      w: Math.abs(pos.x - startPt.x),
      h: Math.abs(pos.y - startPt.y),
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
      // También disparar el refresh completo de la galería
      await fetch("/api/admin/galeria", { method: "PUT" });

      setMsg("✅ Guardado y publicado en el sitio.");
      const v = `?v=${Date.now()}`;
      setImages((prev) => prev.map((img) =>
        img.name === editing.name
          ? { ...img, regions, processed: true }
          : img
      ));
      setEditing((e) => e ? { ...e, regions } : e);
      // Cerrar el editor tras 1.5s para que el usuario vea el mensaje
      setTimeout(() => setEditing(null), 1500);
    } else {
      setMsg(`❌ Error: ${json.error}`);
    }
    setSaving(false);
  };

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
    // Recargar lista
    const r = await fetch("/api/admin/galeria");
    const j = await r.json();
    setImages(j.data ?? []);
    setMsg(`✅ ${count} imagen${count !== 1 ? "es" : ""} subida${count !== 1 ? "s" : ""} correctamente.`);
    setUploading(false);
  };

  const refreshAll = async () => {
    setRefreshing(true);
    setMsg("");
    const res  = await fetch("/api/admin/galeria", { method: "PUT" });
    const json = await res.json();
    if (res.ok) {
      setMsg(`✅ ${json.data.processed} imágenes actualizadas. Recargando...`);
      // Recargar lista de imágenes con nuevo timestamp
      setTimeout(async () => {
        const r = await fetch("/api/admin/galeria");
        const j = await r.json();
        setImages(j.data ?? []);
        setMsg(`✅ Galería actualizada (${json.data.processed} imágenes). Ahora ve al inicio para ver los cambios.`);
        setRefreshing(false);
      }, 1500);
    } else {
      setMsg("❌ Error al actualizar. Intenta de nuevo.");
      setRefreshing(false);
    }
  };

  if (loading) return <p className="text-sm" style={{ color: "#94a3b8" }}>Cargando imágenes...</p>;

  return (
    <div className="space-y-6">
      {/* ── EDITOR MODAL ── */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,.92)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{ width: "100%", maxWidth: 900, background: "#05051a", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,168,76,.3)" }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p className="font-black text-white">{editing.name}</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Arrastra sobre las zonas con rostros para difuminarlas. Clic en × para quitar una zona.
                </p>
              </div>
              <button onClick={() => setEditing(null)} style={{ color: "#ef4444", background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            {/* Canvas de edición — outer captura eventos del mouse */}
            <div
              ref={containerRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ background: "#000", display: "flex", justifyContent: "center", alignItems: "center", userSelect: "none", cursor: "crosshair", maxHeight: "62vh", overflow: "hidden" }}>

              {/* Wrapper exactamente del tamaño de la imagen — overlays aquí */}
              <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>

                {/* Imagen real */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={editing.original}
                  alt={editing.name}
                  draggable={false}
                  style={{ display: "block", maxHeight: "60vh", maxWidth: "100%", pointerEvents: "none" }}
                />

                {/* Regiones guardadas — posicionadas sobre la imagen real */}
                {regions.map((r, i) => (
                  <div key={i} style={{
                    position: "absolute",
                    left:   `${r.x * 100}%`,
                    top:    `${r.y * 100}%`,
                    width:  `${r.w * 100}%`,
                    height: `${r.h * 100}%`,
                    background: "rgba(124,58,237,.4)",
                    border: "2px solid #c084fc",
                    backdropFilter: "blur(6px)",
                    boxSizing: "border-box",
                    zIndex: 10,
                  }}>
                    <button onClick={(e) => { e.stopPropagation(); removeRegion(i); }}
                      style={{ position: "absolute", top: -11, right: -11, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "2px solid #fff", fontSize: "0.8rem", cursor: "pointer", lineHeight: "18px", textAlign: "center", zIndex: 20 }}>
                      ×
                    </button>
                    <span style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: "0.6rem", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,.9)", whiteSpace: "nowrap", background: "rgba(0,0,0,.5)", padding: "1px 6px", borderRadius: 4 }}>
                      zona {i + 1}
                    </span>
                  </div>
                ))}

                {/* Zona que se está dibujando */}
                {drawing && currentR && currentR.w > 0.005 && currentR.h > 0.005 && (
                  <div style={{
                    position: "absolute",
                    left:   `${currentR.x * 100}%`,
                    top:    `${currentR.y * 100}%`,
                    width:  `${currentR.w * 100}%`,
                    height: `${currentR.h * 100}%`,
                    background: "rgba(56,189,248,.2)",
                    border: "2px dashed #38bdf8",
                    boxSizing: "border-box",
                    pointerEvents: "none",
                    zIndex: 10,
                  }} />
                )}

                {/* Instrucción inicial */}
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

            {/* Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button onClick={() => setRegions([])}
                  className="text-sm font-bold px-4 py-2 rounded-lg border transition-all"
                  style={{ borderColor: "rgba(239,68,68,.4)", color: "#ef4444", background: "rgba(239,68,68,.08)" }}>
                  🗑 Quitar todo
                </button>
                <span className="text-sm" style={{ color: "#94a3b8", lineHeight: "2.2rem" }}>
                  {regions.length} zona{regions.length !== 1 ? "s" : ""} marcada{regions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {msg && <span className="text-sm font-bold" style={{ color: msg.startsWith("✅") ? "#22c55e" : "#ef4444" }}>{msg}</span>}
                <button onClick={save} disabled={saving}
                  className="btn-gold text-sm px-6 py-2.5 disabled:opacity-50">
                  {saving ? "Procesando..." : "✓ Aplicar y guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBIR NUEVAS IMÁGENES ── */}
      <div className="aura-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-0">
          <div>
            <p className="font-black text-white mb-0.5">Agregar fotos al carrusel</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              JPG, PNG o WebP · Se agregan al inicio (más recientes primero)
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            {msg.includes("subida") && <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{msg}</span>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-gold px-6 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2">
              {uploading ? "Subiendo..." : "📤 Subir fotos"}
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTÓN ACTUALIZAR GALERÍA ── */}
      <div className="aura-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-black text-white mb-0.5">Publicar cambios en el sitio</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Reprocesa todas las imágenes con las zonas guardadas y actualiza el carrusel del inicio.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {msg && (
            <span className="text-sm font-bold" style={{ color: msg.startsWith("✅") ? "#22c55e" : "#ef4444" }}>
              {msg}
            </span>
          )}
          <button onClick={refreshAll} disabled={refreshing}
            className="btn-gold px-6 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2">
            {refreshing ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Procesando...
              </>
            ) : (
              "🔄 Actualizar galería en el sitio"
            )}
          </button>
        </div>
      </div>

      {/* ── GRID DE IMÁGENES ── */}
      <p className="text-xs" style={{ color: "#94a3b8" }}>
        Haz clic en cualquier imagen para abrir el editor y marcar las zonas a difuminar.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {images.map((img) => (
          <div key={img.name}
            onClick={() => openEditor(img)}
            style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", cursor: "pointer", border: img.regions.length > 0 ? "2px solid #9333ea" : "2px solid rgba(255,255,255,.08)", transition: "border-color 0.2s, transform 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.original} alt={img.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

            {/* Badge zonas */}
            {img.regions.length > 0 && (
              <div style={{ position: "absolute", top: 6, right: 6, background: "#9333ea", color: "#fff", borderRadius: 999, fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px" }}>
                {img.regions.length} zona{img.regions.length > 1 ? "s" : ""} 🔵
              </div>
            )}
            {img.regions.length === 0 && (
              <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,.6)", color: "#94a3b8", borderRadius: 999, fontSize: "0.62rem", padding: "2px 8px" }}>
                Sin difuminar
              </div>
            )}

            {/* Hover overlay */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>✏️ Editar difuminado</span>
            </div>

            {/* Nombre */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,.8), transparent)", padding: "0.5rem 0.6rem" }}>
              <p style={{ color: "#fff", fontSize: "0.68rem", fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {img.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
