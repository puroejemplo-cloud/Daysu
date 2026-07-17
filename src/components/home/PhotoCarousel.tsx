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
    <section style={{ padding: "4rem 0 5rem", borderTop: "1px solid rgba(255,255,255,.05)", position: "relative" }}>
      {/* Glow de fondo sutil */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 1, background: "linear-gradient(90deg, transparent, rgba(232,25,138,.4), transparent)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.25rem" }}>

        <p className="section-label" style={{ textAlign: "center", letterSpacing: "0.35em" }}>Nuestros eventos</p>
        <h2 className="section-title bebas" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          Momentos{" "}
          <em style={{ background: "linear-gradient(135deg, var(--gold), var(--gold2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "italic" }}>Legendarios</em>
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.85rem", marginBottom: "1.75rem", letterSpacing: "0.04em" }}>
          Bodas · Quinceañeras · Cumpleaños · Eventos VIP · Zacatecas
        </p>

        {/* ── Imagen principal ── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            position: "relative", borderRadius: 20, overflow: "hidden",
            background: "#05050f", userSelect: "none",
            boxShadow: "0 0 0 1px rgba(232,25,138,.25), 0 0 60px rgba(124,58,237,.2), 0 0 100px rgba(232,25,138,.08), 0 32px 64px rgba(0,0,0,.6)",
          }}>

          <video autoPlay muted loop playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, filter: "blur(2px) brightness(0.6)", zIndex: 0 }}>
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,15,.55)", zIndex: 1 }} />

          <div className="carousel-img-wrap"
            style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: "opacity 0.18s ease", opacity: fade ? 1 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${photo.src}?v=${V}`} alt={photo.alt} loading="eager" decoding="async"
              style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }} />
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, rgba(5,5,15,.9) 0%, transparent 100%)", pointerEvents: "none", zIndex: 3 }} />

          <div style={{ position: "absolute", bottom: "1.25rem", left: "1.25rem", right: "4.5rem", zIndex: 4 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", textShadow: "0 1px 4px rgba(0,0,0,.9)" }}>{photo.alt}</p>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: "0.68rem", marginTop: "0.25rem", letterSpacing: "0.12em", fontVariantNumeric: "tabular-nums" }}>{String(idx + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</p>
          </div>

          <button onClick={prev} aria-label="Foto anterior"
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(232,25,138,.3)", color: "#fff", borderRadius: "50%", width: 44, height: 44, fontSize: "1.3rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, transition: "border-color .2s, background .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,25,138,.7)"; e.currentTarget.style.background = "rgba(232,25,138,.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(232,25,138,.3)"; e.currentTarget.style.background = "rgba(0,0,0,.65)"; }}>‹</button>
          <button onClick={next} aria-label="Foto siguiente"
            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(232,25,138,.3)", color: "#fff", borderRadius: "50%", width: 44, height: 44, fontSize: "1.3rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, transition: "border-color .2s, background .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,25,138,.7)"; e.currentTarget.style.background = "rgba(232,25,138,.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(232,25,138,.3)"; e.currentTarget.style.background = "rgba(0,0,0,.65)"; }}>›</button>
        </div>

        {/* ── Thumbnails ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {images.map((p, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Ver foto ${i + 1}: ${p.alt}`} aria-current={i === idx ? "true" : undefined}
              style={{ flex: "0 0 80px", height: 56, borderRadius: 8, overflow: "hidden", border: i === idx ? "2px solid var(--gold)" : "2px solid transparent", opacity: i === idx ? 1 : 0.55, cursor: "pointer", padding: 0, background: "#000", transition: "opacity 0.2s, border-color 0.2s", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${p.src}?v=${V}`} alt="" loading="lazy" decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>

        {/* ── Dots ── */}
        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", marginTop: "1rem" }}>
          {images.map((p, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Ir a foto ${i + 1}: ${p.alt}`} aria-current={i === idx ? "true" : undefined}
              style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 999, background: i === idx ? "var(--gold)" : "rgba(255,255,255,.2)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
          ))}
        </div>

        {/* Redes sociales */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
          {[
            { label: "Instagram", icon: "📸", href: "https://instagram.com/daysu.vip" },
            { label: "TikTok",    icon: "🎵", href: "https://tiktok.com/@daysu.vip"    },
            { label: "Facebook",  icon: "👥", href: "https://www.facebook.com/profile.php?id=100051778765950" },
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
