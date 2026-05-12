"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { WeddingForm } from "./WeddingForm";

const EVENT_LABELS = ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación"];

interface Props {
  heroImage?: string | null;
}

export function WeddingFloatingCTA({ heroImage }: Props) {
  const [visible, setVisible]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen]           = useState(false);
  const [labelIndex, setLabelIndex]   = useState(0);
  const [labelVisible, setLabelVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

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
      {/* ── Banner ── */}
      <div
        className="wp-cta-wrapper"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 45,
          display: "flex",
          justifyContent: "center",
          padding: "0 0.75rem 0.75rem",
          pointerEvents: visible ? "auto" : "none",
          transform: visible ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          className="wp-cta-card"
          style={{
            width: "100%",
            maxWidth: 680,
            background: "rgba(9,9,11,0.97)",
            border: "1px solid rgba(232,25,138,0.3)",
            borderRadius: "1.125rem",
            boxShadow: "0 -4px 40px rgba(232,25,138,0.15), 0 8px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* ── Desktop layout (una fila) ── */}
          <div className="wp-cta-desktop" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.8rem 0.8rem 0.8rem 0.8rem" }}>
            {heroImage && (
              <div style={{
                width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
                background: `url('${heroImage}') center/cover`,
                border: "2px solid var(--gold)",
                boxShadow: "0 0 0 3px rgba(232,25,138,0.2)",
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 2 }}>✨ Wedding Planner · Aura Producciones</p>
              <p style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--cream)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                ¿Quieres que nos encarguemos de tu{" "}
                <span style={{ color: "var(--gold)", transition: "opacity 0.35s", opacity: labelVisible ? 1 : 0, display: "inline-block", minWidth: 110 }}>
                  {EVENT_LABELS[labelIndex]}?
                </span>
              </p>
            </div>
            <button onClick={() => setOpen(true)} className="wp-cta-btn">
              Sí, platícanos →
              <span className="wp-shimmer" />
            </button>
            <button onClick={() => setDismissed(true)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0.25rem", display: "flex", flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>

          {/* ── Mobile layout (dos filas) ── */}
          <div className="wp-cta-mobile" style={{ display: "none", flexDirection: "column", padding: "0.75rem 0.875rem 0.875rem" }}>
            {/* Fila 1: texto + cerrar */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: "0.5rem" }}>
                <p style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: 3 }}>✨ Wedding Planner</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--cream)", lineHeight: 1.35 }}>
                  ¿Nos encargamos de tu{" "}
                  <span style={{ color: "var(--gold)", transition: "opacity 0.35s", opacity: labelVisible ? 1 : 0, display: "inline-block" }}>
                    {EVENT_LABELS[labelIndex]}?
                  </span>
                </p>
              </div>
              <button onClick={() => setDismissed(true)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0.1rem", flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>
            {/* Fila 2: botón full width */}
            <button onClick={() => setOpen(true)} className="wp-cta-btn" style={{ width: "100%", justifyContent: "center" }}>
              Sí, platícanos →
              <span className="wp-shimmer" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60, backdropFilter: "blur(5px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 61,
            width: "min(560px, calc(100vw - 1.5rem))",
            maxHeight: "calc(100svh - 1.5rem)",
            overflowY: "auto",
            background: "#09090b",
            borderRadius: "1.25rem",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          }}>
            {heroImage && (
              <div style={{
                height: 120,
                backgroundImage: `url('${heroImage}')`,
                backgroundSize: "cover", backgroundPosition: "center",
                borderRadius: "1.25rem 1.25rem 0 0", position: "relative",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, rgba(5,5,26,0.2), rgba(5,5,26,0.88))",
                  borderRadius: "1.25rem 1.25rem 0 0",
                  display: "flex", alignItems: "flex-end", padding: "0.875rem 1.25rem",
                }}>
                  <p style={{ color: "var(--cream)", fontSize: "0.95rem", fontWeight: 600 }}>
                    Planificamos tu evento desde cero ✨
                  </p>
                </div>
              </div>
            )}
            <button onClick={() => setOpen(false)} style={{
              position: "absolute", top: "0.625rem", right: "0.625rem",
              background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--cream)", zIndex: 1,
            }}>
              <X size={15} />
            </button>
            <WeddingForm compact />
          </div>
        </>
      )}

      <style>{`
        .wp-cta-btn {
          position: relative; overflow: hidden;
          background: var(--gold); color: #05051a;
          border: none; border-radius: 0.625rem;
          padding: 0.55rem 1rem; font-size: 0.82rem;
          font-weight: 700; cursor: pointer;
          white-space: nowrap; display: flex;
          align-items: center; gap: 0.25rem;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .wp-cta-btn:hover { background: var(--gold2); }
        .wp-shimmer {
          position: absolute; top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: wpShimmer 2.5s infinite;
        }
        @keyframes wpShimmer {
          0%   { left: -75%; }
          60%  { left: 125%; }
          100% { left: 125%; }
        }
        @media (max-width: 540px) {
          .wp-cta-desktop { display: none !important; }
          .wp-cta-mobile  { display: flex !important; }
        }
      `}</style>
    </>
  );
}
