"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";

const EVENT_LABELS = ["Boda", "XV Años", "Fiesta", "Evento Corporativo", "Graduación"];

interface Props {
  heroImage?: string | null;
}

export function WeddingFloatingCTA({ heroImage }: Props) {
  const [visible, setVisible]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [labelIndex, setLabelIndex]     = useState(0);
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
      {/* wrapper: deja espacio derecho para el botón WhatsApp (~80px) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 45,
          display: "flex",
          justifyContent: "center",
          padding: "0 5rem 0.75rem 0.75rem", // right: 5rem = espacio para WhatsApp
          pointerEvents: visible ? "auto" : "none",
          transform: visible ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            background: "rgba(9,9,11,0.97)",
            border: "1px solid rgba(232,25,138,0.3)",
            borderRadius: "1.125rem",
            boxShadow: "0 -4px 40px rgba(232,25,138,0.15), 0 8px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* ── Desktop (una fila) ── */}
          <div className="wp-desktop" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.8rem" }}>
            {heroImage && (
              <div style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: `url('${heroImage}') center/cover`,
                border: "2px solid var(--gold)",
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: 2 }}>✨ Wedding Planner · Aura Producciones</p>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--cream)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                ¿Quieres que nos encarguemos de tu{" "}
                <span style={{ color: "var(--gold)", transition: "opacity 0.35s", opacity: labelVisible ? 1 : 0, display: "inline-block", minWidth: 110 }}>
                  {EVENT_LABELS[labelIndex]}?
                </span>
              </p>
            </div>
            <Link href="/wedding-planner#contacto" className="wp-cta-btn">
              Sí, platícanos →
              <span className="wp-shimmer" />
            </Link>
            <button onClick={() => setDismissed(true)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0.25rem", display: "flex", flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>

          {/* ── Mobile (dos filas) ── */}
          <div className="wp-mobile" style={{ display: "none", flexDirection: "column", padding: "0.75rem 0.875rem 0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem", gap: "0.5rem" }}>
              {/* Foto en mobile */}
              {heroImage && (
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: `url('${heroImage}') center/cover`,
                  border: "2px solid var(--gold)",
                }} />
              )}
              <div style={{ flex: 1, paddingRight: "0.25rem" }}>
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
            <Link href="/wedding-planner#contacto" className="wp-cta-btn" style={{ justifyContent: "center", textDecoration: "none" }}>
              Sí, platícanos →
              <span className="wp-shimmer" />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .wp-cta-btn {
          position: relative; overflow: hidden;
          background: var(--gold); color: #05051a;
          border: none; border-radius: 0.625rem;
          padding: 0.55rem 1rem; font-size: 0.82rem;
          font-weight: 700; cursor: pointer;
          white-space: nowrap; display: flex;
          align-items: center; gap: 0.25rem;
          flex-shrink: 0; transition: background 0.15s;
          text-decoration: none;
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
          .wp-desktop { display: none !important; }
          .wp-mobile  { display: flex !important; }
        }
      `}</style>
    </>
  );
}
