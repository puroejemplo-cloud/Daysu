"use client";
import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { WeddingForm } from "./WeddingForm";

interface Props {
  heroImage?: string | null;
}

export function WeddingFloatingCTA({ heroImage }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Burbuja flotante ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Planifica tu evento con nosotros"
        style={{
          position: "fixed",
          bottom: "6rem",
          left: "1.25rem",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          background: "#09090b",
          border: "1px solid rgba(232,25,138,0.35)",
          borderRadius: "9999px",
          padding: "0.45rem 1rem 0.45rem 0.45rem",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(232,25,138,0.18)",
          animation: "wpPulse 3s ease-in-out infinite",
          maxWidth: 260,
        }}
      >
        {/* Avatar circular con la foto del hero */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            flexShrink: 0,
            background: heroImage
              ? `url('${heroImage}') center/cover`
              : "linear-gradient(135deg, var(--gold), #7C3AED)",
            border: "2px solid var(--gold)",
            overflow: "hidden",
          }}
        />

        {/* Texto */}
        <div style={{ textAlign: "left", minWidth: 0 }}>
          <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: 1 }}>
            <Sparkles size={10} style={{ display: "inline", marginRight: 3, color: "var(--gold)" }} />
            Wedding Planner
          </p>
          <p style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--cream)",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            ¿Nos encargamos de todo?
          </p>
        </div>
      </button>

      {/* ── Modal con formulario ── */}
      {open && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 60,
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 61,
              width: "min(560px, calc(100vw - 2rem))",
              maxHeight: "calc(100svh - 2rem)",
              overflowY: "auto",
              background: "#09090b",
              borderRadius: "1.25rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header del modal */}
            {heroImage && (
              <div
                style={{
                  height: 140,
                  backgroundImage: `url('${heroImage}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRadius: "1.25rem 1.25rem 0 0",
                  position: "relative",
                }}
              >
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, rgba(5,5,26,0.3), rgba(5,5,26,0.85))",
                  borderRadius: "1.25rem 1.25rem 0 0",
                  display: "flex", alignItems: "flex-end",
                  padding: "1rem 1.25rem",
                }}>
                  <p style={{ color: "var(--cream)", fontSize: "1rem", fontWeight: 500 }}>
                    Planificamos tu evento desde cero
                  </p>
                </div>
              </div>
            )}

            {/* Cerrar */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--cream)",
                zIndex: 1,
              }}
            >
              <X size={16} />
            </button>

            {/* Formulario */}
            <div style={{ padding: heroImage ? "0" : "1.5rem 0 0" }}>
              <WeddingForm compact />
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes wpPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(232,25,138,0.18); }
          50% { box-shadow: 0 4px 32px rgba(232,25,138,0.4); }
        }
      `}</style>
    </>
  );
}
