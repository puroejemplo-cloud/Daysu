"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "daysu_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* private browsing */ }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch {}
    setVisible(false);
  };

  const reject = () => {
    try { localStorage.setItem(STORAGE_KEY, "rejected"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div role="dialog" aria-label="Aviso de cookies" className="cookie-banner">
        {/* Fila superior: icono + texto */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.25rem", flexShrink: 0, lineHeight: 1.2 }}>🍪</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f4f4f5", marginBottom: "0.3rem" }}>
              Usamos cookies
            </p>
            <p style={{ fontSize: "0.76rem", color: "#71717a", lineHeight: 1.6 }}>
              Cookies técnicas y analíticas para mejorar tu experiencia.{" "}
              <Link href="/privacidad" style={{ color: "var(--gold)", textDecoration: "none", whiteSpace: "nowrap" }}>
                Ver política
              </Link>
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="cookie-btns">
          <button onClick={accept} className="cookie-accept">
            Aceptar todo
          </button>
          <button onClick={reject} className="cookie-reject">
            Solo necesarias
          </button>
        </div>
      </div>

      <style>{`
        .cookie-banner {
          position: fixed;
          bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
          left: 50%;
          transform: translateX(-50%);
          z-index: 9980;
          width: calc(100% - 1.5rem);
          max-width: 500px;
          background: #0f0f14;
          border: 1px solid rgba(232,25,138,0.25);
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,25,138,0.08);
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          animation: fadeUp 0.3s ease both;
        }
        .cookie-btns {
          display: flex;
          gap: 0.5rem;
        }
        .cookie-accept {
          flex: 1;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          background: var(--gold);
          color: #05051a;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
          min-height: 44px;
        }
        .cookie-accept:hover { opacity: 0.88; }
        .cookie-reject {
          flex: 1;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          background: transparent;
          color: #71717a;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          min-height: 44px;
        }
        .cookie-reject:hover { color: #a1a1aa; border-color: rgba(255,255,255,0.2); }

        /* Móvil: botones apilados, ancho completo */
        @media (max-width: 400px) {
          .cookie-banner {
            width: calc(100% - 1rem);
            border-radius: 0.875rem 0.875rem 0 0;
            bottom: 0;
            left: 0;
            transform: none;
          }
          .cookie-btns { flex-direction: column; }
        }
      `}</style>
    </>
  );
}
