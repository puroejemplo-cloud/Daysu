"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const PHOTOS = [
  { src: "/galeria/robot1.webp",                    alt: "Show Robot LED en vivo",           event: "Show Robot LED"        },
  { src: "/galeria/robot03.webp",                   alt: "Robot LED — efectos especiales",   event: "Show Robot LED"        },
  { src: "/galeria/robot04.webp",                   alt: "Robot LED interactivo",            event: "Show Robot LED"        },
  { src: "/galeria/robot05.webp",                   alt: "Robot LED con iluminación",        event: "Show Robot LED"        },
  { src: "/galeria/robot06.webp",                   alt: "Robot LED show completo",          event: "Show Robot LED"        },
  { src: "/galeria/cabezones-robot-led.webp",       alt: "Cabezones + Robot LED",            event: "Cabezones + Robot LED" },
  { src: "/galeria/cabezon-pirotecnia.webp",        alt: "Cabezón + Pirotecnia fría",        event: "Pirotecnia Fría"       },
  { src: "/galeria/cabezones-03.webp",              alt: "Show Cabezones en evento",         event: "Show Cabezones"        },
  { src: "/galeria/cabezones02.webp",               alt: "Cabezones animando el evento",     event: "Show Cabezones"        },
  { src: "/galeria/cabezones-carrito-de-shots.webp",alt: "Cabezones + Carrito de Shots",     event: "Shots Iluminados"      },
  { src: "/galeria/carrito-de-shots01.webp",        alt: "Carrito de shots iluminados",      event: "Shots Iluminados"      },
  { src: "/galeria/carrito-de-shot-02.webp",        alt: "Shots RGB en evento",              event: "Shots Iluminados"      },
  { src: "/galeria/limbo-led.webp",                 alt: "Limbo LED interactivo",            event: "Limbo LED"             },
  { src: "/galeria/sonido01.webp",                  alt: "Sistema de sonido profesional",    event: "Sonido Profesional"    },
  { src: "/galeria/sonido01-2.webp",                alt: "Audio profesional en evento",      event: "Sonido Profesional"    },
  { src: "/galeria/sonido03.webp",                  alt: "DJ y sonido en vivo",              event: "DJ en Vivo"            },
];

// Agrupar por tipo para los filtros
const TYPES = ["Todos", ...Array.from(new Set(PHOTOS.map((p) => p.event)))];

export default function PhotoCarousel() {
  const [filter,    setFilter]    = useState("Todos");
  const [idx,       setIdx]       = useState(0);
  const [fade,      setFade]      = useState(true);
  const [paused,    setPaused]    = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timestamp solo en cliente para evitar hydration mismatch
  const V = mounted ? Math.floor(Date.now() / 60000) : 0;

  useEffect(() => { setMounted(true); }, []);

  const filtered = filter === "Todos" ? PHOTOS : PHOTOS.filter((p) => p.event === filter);

  const goTo = useCallback((i: number) => {
    setFade(false);
    setTimeout(() => {
      setIdx(i);
      setFade(true);
    }, 180);
  }, []);

  const next = useCallback(() => goTo((idx + 1) % filtered.length), [idx, filtered.length, goTo]);
  const prev = useCallback(() => goTo((idx - 1 + filtered.length) % filtered.length), [idx, filtered.length, goTo]);

  // Reset index when filter changes
  useEffect(() => { setIdx(0); setFade(true); }, [filter]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  const photo = filtered[idx] ?? filtered[0];
  if (!photo) return null;

  return (
    <section style={{ padding: "4rem 0 5rem", borderTop: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.25rem" }}>

        {/* Header */}
        <p className="section-label" style={{ textAlign: "center" }}>Nuestros eventos</p>
        <h2 className="section-title bebas" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          Momentos{" "}
          <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Legendarios</em>
        </h2>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.75rem" }}>
          Especializados en bodas, quinceañeras, cumpleaños y más · Zacatecas
        </p>

        {/* Filtros por tipo */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.5rem" }}>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              style={{
                padding: "0.35rem 1rem", borderRadius: 999, fontSize: "0.75rem",
                fontWeight: 700, border: "1px solid", cursor: "pointer", transition: "all 0.2s",
                background: filter === t ? "var(--gold)" : "rgba(255,255,255,.04)",
                borderColor: filter === t ? "var(--gold)" : "rgba(255,255,255,.1)",
                color: filter === t ? "#05051a" : "#94a3b8",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── IMAGEN PRINCIPAL ── */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            position: "relative", borderRadius: 16, overflow: "hidden",
            background: "#05050f", userSelect: "none",
            // Brillo/glow en el borde
            boxShadow: "0 0 0 1px rgba(201,168,76,.3), 0 0 40px rgba(124,58,237,.25), 0 0 80px rgba(201,168,76,.1)",
          }}>

          {/* Video de fondo — loop silencioso detrás de la foto */}
          <video
            autoPlay muted loop playsInline
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              opacity: 0.3,
              filter: "blur(2px) brightness(0.6)",
              zIndex: 0,
            }}>
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>

          {/* Overlay oscuro sobre el video para que la foto resalte */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,15,.55)", zIndex: 1 }} />

          {/* Foto — completa, sin recorte, encima del video */}
          <div style={{
            position: "relative", zIndex: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 320, maxHeight: "70vh", overflow: "hidden",
            transition: "opacity 0.18s ease", opacity: fade ? 1 : 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${photo.src}?v=${V}`}
              alt={photo.alt}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                width: "auto",
                height: "auto",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Overlay degradado para que el texto sea legible */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, rgba(5,5,15,.9) 0%, transparent 100%)", pointerEvents: "none", zIndex: 3 }} />

          {/* Badge tipo de evento */}
          <div style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 4 }}>
            <span style={{ background: "var(--gold)", color: "#05051a", padding: "0.3rem 0.9rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,.4)" }}>
              {photo.event}
            </span>
          </div>

          {/* Texto info */}
          <div style={{ position: "absolute", bottom: "1.25rem", left: "1.25rem", right: "4.5rem", zIndex: 4 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", textShadow: "0 1px 4px rgba(0,0,0,.9)" }}>
              {photo.alt}
            </p>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: "0.72rem", marginTop: "0.2rem" }}>
              {idx + 1} / {filtered.length}
            </p>
          </div>

          {/* Flechas */}
          <button onClick={prev}
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>
            ‹
          </button>
          <button onClick={next}
            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>
            ›
          </button>
        </div>

        {/* ── TIRA DE THUMBNAILS ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {filtered.map((p, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{
                flex: "0 0 80px", height: 56, borderRadius: 8, overflow: "hidden",
                border: i === idx ? "2px solid var(--gold)" : "2px solid transparent",
                opacity: i === idx ? 1 : 0.55, cursor: "pointer", padding: 0, background: "#000",
                transition: "opacity 0.2s, border-color 0.2s", flexShrink: 0,
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${p.src}?v=${V}`} alt={p.alt}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>

        {/* Dots */}
        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", marginTop: "1rem" }}>
          {filtered.map((_, i) => (
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
