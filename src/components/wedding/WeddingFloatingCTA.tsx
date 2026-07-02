"use client";
import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";

const DISMISS_KEY = "wp_cta_dismissed";
const DISMISS_MS  = 7 * 24 * 60 * 60 * 1000; // recuerda el cierre 7 días

const EVENT_LABELS = [
  "Fiesta",
  "XV Años",
  "Boda",
  "Evento Empresarial",
  "Graduación",
];

interface Props {
  heroImage?: string | null;
}

export function WeddingFloatingCTA({ heroImage }: Props) {
  const [visible,      setVisible]      = useState(false);
  const [dismissed,    setDismissed]    = useState(false);
  const [labelIndex,   setLabelIndex]   = useState(0);
  const [animState,    setAnimState]    = useState<"in" | "out">("in");

  useEffect(() => {
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (ts && Date.now() - Number(ts) < DISMISS_MS) { setDismissed(true); return; }
    } catch { /* localStorage no disponible */ }
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
  };

  useEffect(() => {
    if (!visible) return;
    const iv = setInterval(() => {
      setAnimState("out");
      setTimeout(() => {
        setLabelIndex((i) => (i + 1) % EVENT_LABELS.length);
        setAnimState("in");
      }, 400);
    }, 2800);
    return () => clearInterval(iv);
  }, [visible]);

  if (dismissed) return null;

  const label = EVENT_LABELS[labelIndex];

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 45,
          display: "flex",
          justifyContent: "center",
          padding: "0 5rem 0.75rem 0.75rem",
          pointerEvents: visible ? "auto" : "none",
          transform: visible ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div style={{
          width: "100%", maxWidth: 640,
          background: "rgba(9,9,11,0.97)",
          border: "1px solid rgba(232,25,138,0.3)",
          borderRadius: "1.125rem",
          boxShadow: "0 -4px 40px rgba(232,25,138,0.15), 0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(16px)",
        }}>

          {/* ── Desktop ── */}
          <div className="wp-desktop" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0.875rem", flexWrap: "wrap" }}>
            {heroImage && (
              <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: `url('${heroImage}') center/cover`, border: "2px solid var(--gold)" }} />
            )}
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <p style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: 2, letterSpacing: "0.06em" }}><Sparkles size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 3, color: "var(--gold)" }} />Wedding Planner · Pao Rosales</p>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--cream)", lineHeight: 1.35 }}>
                ¿Nos encargamos de tu{" "}
                <span className={`wp-word wp-word--${animState}`}
                  style={{ color: "var(--gold)", fontWeight: 800, display: "inline-block" }}>
                  {label}?
                </span>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <Link href="/wedding-planner#contacto" className="wp-cta-btn">
                Sí, platícanos →
                <span className="wp-shimmer" />
              </Link>
              <button onClick={dismiss} aria-label="Cerrar" style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0.3rem", display: "flex" }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* ── Mobile ── */}
          <div className="wp-mobile" style={{ display: "none", flexDirection: "column", padding: "0.75rem 0.875rem 0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem", gap: "0.5rem" }}>
              {heroImage && (
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: `url('${heroImage}') center/cover`, border: "2px solid var(--gold)" }} />
              )}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ fontSize: "0.62rem", color: "var(--muted)", marginBottom: 3 }}><Sparkles size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 3, color: "var(--gold)" }} />Wedding Planner · Pao Rosales</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--cream)", whiteSpace: "nowrap" }}>
                    ¿Nos encargamos de tu
                  </span>
                  <span className={`wp-word wp-word--${animState}`}
                    style={{ color: "var(--gold)", fontWeight: 800, fontSize: "0.88rem", whiteSpace: "nowrap", display: "inline-block" }}>
                    {label}?
                  </span>
                </div>
              </div>
              <button onClick={dismiss} aria-label="Cerrar" style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0.1rem", flexShrink: 0 }}>
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
        /* ── Animación slide-up para las palabras ── */
        @keyframes wpWordIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes wpWordOut {
          from { opacity: 1; transform: translateY(0);    }
          to   { opacity: 0; transform: translateY(-8px); }
        }
        .wp-word--in  { animation: wpWordIn  0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        .wp-word--out { animation: wpWordOut 0.3s ease both; }

        .wp-cta-btn {
          position: relative; overflow: hidden;
          background: var(--gold); color: #05051a;
          border: none; border-radius: 0.625rem;
          padding: 0.6rem 1.1rem; font-size: 0.82rem;
          font-weight: 700; cursor: pointer;
          white-space: nowrap; display: flex;
          align-items: center; gap: 0.25rem;
          flex-shrink: 0; transition: background 0.15s;
          text-decoration: none; letter-spacing: 0.02em;
        }
        .wp-cta-btn:hover { background: var(--gold2); }
        .wp-shimmer {
          position: absolute; top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: wpShimmer 2.8s infinite;
        }
        @keyframes wpShimmer {
          0%   { left: -75%; }
          60%  { left: 125%; }
          100% { left: 125%; }
        }
        @media (max-width: 580px) {
          .wp-desktop { display: none !important; }
          .wp-mobile  { display: flex !important; }
        }
      `}</style>
    </>
  );
}
