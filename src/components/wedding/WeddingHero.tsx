"use client";

import { useState, useEffect } from "react";

interface WeddingHeroProps {
  eventTypes: string[];
  subtitle: string;
  heroImage?: string;
  plannerPhoto?: string;
  plannerName?: string;
}

export function WeddingHero({ eventTypes, subtitle, heroImage, plannerPhoto, plannerName }: WeddingHeroProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (eventTypes.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % eventTypes.length);
        setVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, [eventTypes.length]);

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroImage ?? "/wedding/hero.jpg"}')` }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(5,5,26,0.65)" }} />

      {/* Layout: texto centrado + foto del planner flotante */}
      <div className="relative z-10 w-full" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>

          {/* Texto hero */}
          <div style={{ textAlign: "center", maxWidth: 640 }}>
            <p
              className="text-lg md:text-2xl mb-1"
              style={{ color: "var(--cream)", fontWeight: 300, letterSpacing: "0.05em" }}
            >
              Planificamos tu
            </p>
            <h1
              className="text-5xl md:text-7xl font-bold mb-2"
              style={{
                color: "#D4AF37",
                transition: "opacity 0.4s ease",
                opacity: visible ? 1 : 0,
                minHeight: "1.2em",
              }}
            >
              {eventTypes[index] ?? "Boda"}
            </h1>
            <p
              className="text-lg md:text-2xl mb-6"
              style={{ color: "var(--cream)", fontWeight: 300 }}
            >
              desde cero. Tú solo disfruta.
            </p>
            {subtitle && (
              <p className="text-base mb-10" style={{ color: "rgba(245,240,232,0.6)", maxWidth: 420 }}>
                {subtitle}
              </p>
            )}
            <a
              href="#contacto"
              className="btn-gold inline-block px-8 py-4 text-base rounded-full"
              style={{ textDecoration: "none", background: "#D4AF37", color: "#05051a" }}
            >
              Quiero planificar mi evento
            </a>

            {/* Firma del planner */}
            {plannerPhoto && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.625rem",
                marginTop: "1.5rem",
                padding: "0.45rem 0.875rem 0.45rem 0.45rem",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "9999px",
                backdropFilter: "blur(8px)",
              }}>
                <img
                  src={plannerPhoto}
                  alt={plannerName ?? "Planner"}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    objectFit: "cover", objectPosition: "center top",
                    border: "1.5px solid rgba(212,175,55,0.5)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f5f0e8", lineHeight: 1.2, margin: 0 }}>
                    {plannerName ?? "Wedding Planner"}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#D4AF37", letterSpacing: "0.06em", margin: 0 }}>
                    Wedding Planner
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
