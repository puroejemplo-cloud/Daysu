"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface CarouselPhoto { src: string; alt: string; }

export default function PhotoCarousel({ images = [] }: { images?: CarouselPhoto[] }) {
  const [idx,     setIdx]     = useState(0);
  const [fade,    setFade]    = useState(true);
  const [paused,  setPaused]  = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const V = mounted ? Math.floor(Date.now() / 60000) : 0;
  useEffect(() => { setMounted(true); }, []);

  const goTo = useCallback((i: number) => {
    setFade(false);
    setTimeout(() => { setIdx(i); setFade(true); }, 180);
  }, []);

  const next = useCallback(() => goTo((idx + 1) % images.length), [idx, images.length, goTo]);
  const prev = useCallback(() => goTo((idx - 1 + images.length) % images.length), [idx, images.length, goTo]);

  useEffect(() => { setIdx(0); setFade(true); }, [images.length]);

  useEffect(() => {
    if (paused || images.length === 0) return;
    timerRef.current = setInterval(next, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, images.length]);

  if (images.length === 0) return null;

  const photo = images[idx] ?? images[0];

  return (
    <section style={{ padding: "4rem 0 5rem", borderTop: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.25rem" }}>

        <p className="section-label" style={{ textAlign: "center" }}>Nuestros eventos</p>
        <h2 className="section-title bebas" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          Momentos{" "}
          <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Legendarios</em>
        </h2>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.75rem" }}>
          Especializados en bodas, quinceañeras, cumpleaños y más · Zacatecas
        </p>

        {/* ── Imagen principal ── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            position: "relative", borderRadius: 16, overflow: "hidden",
            background: "#05050f", userSelect: "none",
            boxShadow: "0 0 0 1px rgba(232,25,138,.3), 0 0 40px rgba(124,58,237,.25), 0 0 80px rgba(232,25,138,.1)",
          }}>

          <video autoPlay muted loop playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, filter: "blur(2px) brightness(0.6)", zIndex: 0 }}>
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,15,.55)", zIndex: 1 }} />

          <div className="carousel-img-wrap"
            style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: "opacity 0.18s ease", opacity: fade ? 1 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${photo.src}?v=${V}`} alt={photo.alt}
              style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }} />
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, rgba(5,5,15,.9) 0%, transparent 100%)", pointerEvents: "none", zIndex: 3 }} />

          <div style={{ position: "absolute", bottom: "1.25rem", left: "1.25rem", right: "4.5rem", zIndex: 4 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", textShadow: "0 1px 4px rgba(0,0,0,.9)" }}>{photo.alt}</p>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: "0.72rem", marginTop: "0.2rem" }}>{idx + 1} / {images.length}</p>
          </div>

          <button onClick={prev}
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>‹</button>
          <button onClick={next}
            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>›</button>
        </div>

        {/* ── Thumbnails ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {images.map((p, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{ flex: "0 0 80px", height: 56, borderRadius: 8, overflow: "hidden", border: i === idx ? "2px solid var(--gold)" : "2px solid transparent", opacity: i === idx ? 1 : 0.55, cursor: "pointer", padding: 0, background: "#000", transition: "opacity 0.2s, border-color 0.2s", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${p.src}?v=${V}`} alt={p.alt}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>

        {/* ── Dots ── */}
        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", marginTop: "1rem" }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 999, background: i === idx ? "var(--gold)" : "rgba(255,255,255,.2)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
          ))}
        </div>

        {/* Redes sociales */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
          {[
            { label: "Instagram", icon: "📸", href: "https://instagram.com" },
            { label: "TikTok",    icon: "🎵", href: "https://tiktok.com"    },
            { label: "Facebook",  icon: "👥", href: "https://facebook.com"  },
          ].map((sn) => (
            <a key={sn.label} href={sn.href} target="_blank" rel="noopener noreferrer"
              className="btn-ghost"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              {sn.icon} {sn.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
