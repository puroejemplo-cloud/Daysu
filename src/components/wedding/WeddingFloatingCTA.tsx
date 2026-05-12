"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { WeddingForm } from "./WeddingForm";

const EVENT_LABELS = ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación"];

interface Props {
  heroImage?: string | null;
}

export function WeddingFloatingCTA({ heroImage }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [labelIndex, setLabelIndex] = useState(0);
  const [labelVisible, setLabelVisible] = useState(true);

  // Aparece 3 segundos después de cargar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Cicla el tipo de evento cada 2.5 s
  useEffect(() => {
    if (!visible) return;
    const iv = setInterval(() => {
      setLabelVisible(false);
      setTimeout(() => {
        setLabelIndex((i) => (i + 1) % EVENT_LABELS.length);
        setLabelVisible(true);
      }, 350);
    }, 2500);
    return () => clearInterval(iv);
  }, [visible]);

  if (dismissed) return null;

  return (
    <>
      {/* ── Banner inferior ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 45,
          display: "flex",
          justifyContent: "center",
          padding: "0 1rem 1rem",
          pointerEvents: visible ? "auto" : "none",
          transform: visible ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 680,
            background: "rgba(9,9,11,0.97)",
            border: "1px solid rgba(232,25,138,0.3)",
            borderRadius: "1.25rem",
            boxShadow: "0 -4px 40px rgba(232,25,138,0.15), 0 8px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.85rem 1rem 0.85rem 0.85rem",
          }}
        >
          {/* Foto circular */}
          {heroImage && (
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                flexShrink: 0,
                background: `url('${heroImage}') center/cover`,
                border: "2px solid var(--gold)",
                boxShadow: "0 0 0 3px rgba(232,25,138,0.2)",
              }}
            />
          )}

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: 2 }}>
              ✨ Wedding Planner · Aura Producciones
            </p>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--cream)", lineHeight: 1.3 }}>
              ¿Quieres que nos encarguemos de tu{" "}
              <span
                style={{
                  color: "var(--gold)",
                  transition: "opacity 0.35s ease",
                  opacity: labelVisible ? 1 : 0,
                  display: "inline-block",
                  minWidth: 120,
                }}
              >
                {EVENT_LABELS[labelIndex]}?
              </span>
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => setOpen(true)}
            style={{
              flexShrink: 0,
              background: "var(--gold)",
              color: "#05051a",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.6rem 1.1rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
          >
            Sí, platícanos →
            {/* Shimmer */}
            <span style={{
              position: "absolute", top: 0, left: "-75%",
              width: "50%", height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              animation: "wpShimmer 2.5s infinite",
            }} />
          </button>

          {/* Cerrar */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar"
            style={{
              flexShrink: 0,
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Modal con formulario ── */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.75)",
              zIndex: 60,
              backdropFilter: "blur(5px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 61,
              width: "min(560px, calc(100vw - 2rem))",
              maxHeight: "calc(100svh - 2rem)",
              overflowY: "auto",
              background: "#09090b",
              borderRadius: "1.25rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
          >
            {heroImage && (
              <div style={{
                height: 130,
                backgroundImage: `url('${heroImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "1.25rem 1.25rem 0 0",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, rgba(5,5,26,0.2), rgba(5,5,26,0.88))",
                  borderRadius: "1.25rem 1.25rem 0 0",
                  display: "flex", alignItems: "flex-end",
                  padding: "1rem 1.25rem",
                }}>
                  <p style={{ color: "var(--cream)", fontSize: "1rem", fontWeight: 600 }}>
                    Planificamos tu evento desde cero ✨
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute", top: "0.75rem", right: "0.75rem",
                background: "rgba(0,0,0,0.55)", border: "none",
                borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--cream)", zIndex: 1,
              }}
            >
              <X size={16} />
            </button>
            <WeddingForm compact />
          </div>
        </>
      )}

      <style>{`
        @keyframes wpShimmer {
          0%   { left: -75%; }
          60%  { left: 125%; }
          100% { left: 125%; }
        }
      `}</style>
    </>
  );
}
