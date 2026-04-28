"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface Props {
  images: string[];   // URLs de las fotos
  alt:    string;
  className?: string;
  style?: React.CSSProperties;
}

export default function CardCarousel({ images, alt, className, style }: Props) {
  const [current,  setCurrent]  = useState(0);
  const [paused,   setPaused]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);

  // Auto-avance cada 3s cuando no está pausado y hay más de 1 imagen
  useEffect(() => {
    if (images.length <= 1 || paused) return;
    timerRef.current = setInterval(next, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length, paused, next]);

  if (!images.length) return null;

  // Con una sola imagen: render simple sin controles
  if (images.length === 1) {
    return (
      <div className={className} style={{ ...style, borderRadius: "0.75rem 0.75rem 0 0", overflow: "hidden" }}>
        <Image src={images[0]} alt={alt} fill unoptimized
          className="img-fade-in"
          style={{ objectFit: "contain", objectPosition: "center" }} />
      </div>
    );
  }

  return (
    <div className={className} style={{ ...style, position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Imágenes con fade */}
      {images.map((src, i) => (
        <div key={src} style={{
          position: "absolute", inset: 0,
          opacity: i === current ? 1 : 0,
          transition: "opacity 0.6s ease",
          pointerEvents: i === current ? "auto" : "none",
        }}>
          <Image src={src} alt={`${alt} — foto ${i + 1}`} fill unoptimized
            style={{ objectFit: "cover", objectPosition: "center" }} />
        </div>
      ))}

      {/* Flechas — solo en hover (desktop) */}
      {paused && (
        <>
          <button onClick={(e) => { e.preventDefault(); prev(); }}
            aria-label="Foto anterior"
            style={{
              position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
              width: 26, height: 26, borderRadius: "50%", border: "none",
              background: "rgba(5,5,26,.7)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", zIndex: 10,
            }}>‹</button>
          <button onClick={(e) => { e.preventDefault(); next(); }}
            aria-label="Foto siguiente"
            style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              width: 26, height: 26, borderRadius: "50%", border: "none",
              background: "rgba(5,5,26,.7)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", zIndex: 10,
            }}>›</button>
        </>
      )}

      {/* Dots */}
      <div style={{
        position: "absolute", bottom: 6, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: "0.3rem",
        zIndex: 10, pointerEvents: "none",
      }}>
        {images.map((_, i) => (
          <span key={i} style={{
            width: i === current ? 14 : 5, height: 5,
            borderRadius: 99,
            background: i === current ? "var(--gold)" : "rgba(255,255,255,.4)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Contador top-right */}
      <span style={{
        position: "absolute", top: 6, right: 8, zIndex: 10,
        fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,.7)",
        background: "rgba(5,5,26,.6)", padding: "0.15rem 0.45rem", borderRadius: 999,
      }}>
        {current + 1}/{images.length}
      </span>
    </div>
  );
}
