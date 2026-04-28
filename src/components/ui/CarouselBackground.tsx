"use client";
import { useState, useEffect } from "react";

const GALLERY_IMGS = [
  "/galeria/robot1.webp", "/galeria/robot03.webp", "/galeria/robot04.webp",
  "/galeria/robot05.webp", "/galeria/robot06.webp", "/galeria/cabezones-robot-led.webp",
  "/galeria/cabezon-pirotecnia.webp", "/galeria/cabezones-03.webp",
  "/galeria/carrito-de-shots01.webp", "/galeria/limbo-led.webp",
  "/galeria/sonido01.webp", "/galeria/sonido03.webp",
];

export default function CarouselBackground({ opacity = 0.18 }: { opacity?: number }) {
  const [idx,  setIdx]  = useState(0);
  const [fade, setFade] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % GALLERY_IMGS.length);
        setFade(true);
      }, 700);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // No renderizar nada hasta que esté montado en el cliente (evita hydration mismatch)
  if (!mounted) return (
    <div style={{ position: "absolute", inset: 0, background: "#05051a", zIndex: 0 }} />
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>

      {/* Fondo base oscuro */}
      <div style={{ position: "absolute", inset: 0, background: "#05051a" }} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={GALLERY_IMGS[idx]}
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          opacity: fade ? opacity : 0,
          transition: "opacity 0.8s ease",
          filter: "blur(4px) saturate(1.2) brightness(0.55)",
        }}
      />

      {/* Overlay oscuro para que el contenido sea legible */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,26,0.78)" }} />
    </div>
  );
}
