"use client";

import { useState, useEffect } from "react";

interface WeddingHeroProps {
  eventTypes: string[];
  subtitle: string;
  heroImage?: string;
}

export function WeddingHero({ eventTypes, subtitle, heroImage }: WeddingHeroProps) {
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

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <p
          className="text-lg md:text-2xl mb-1"
          style={{ color: "var(--cream)", fontWeight: 300, letterSpacing: "0.05em" }}
        >
          Planificamos tu
        </p>

        <h1
          className="text-5xl md:text-7xl font-bold mb-2"
          style={{
            color: "var(--gold)",
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
          <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}

        <a
          href="#contacto"
          className="btn-gold inline-block px-8 py-4 text-base rounded-full"
          style={{ textDecoration: "none" }}
        >
          Quiero planificar mi evento
        </a>
      </div>
    </section>
  );
}
