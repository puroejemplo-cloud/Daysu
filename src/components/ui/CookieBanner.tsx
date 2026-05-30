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
    <div role="dialog" aria-label="Aviso de cookies"
      style={{
        position: "fixed", bottom: "1.25rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 9980, width: "calc(100% - 2rem)", maxWidth: 520,
        background: "#0f0f14", border: "1px solid rgba(232,25,138,0.25)",
        borderRadius: "1rem", padding: "1.25rem 1.25rem 1.25rem 1.5rem",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,25,138,0.08)",
        display: "flex", flexDirection: "column", gap: "1rem",
        animation: "fadeUp 0.3s ease both",
      }}>
      <div>
        <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#f4f4f5", marginBottom: "0.35rem" }}>
          🍪 Usamos cookies
        </p>
        <p style={{ fontSize: "0.78rem", color: "#71717a", lineHeight: 1.6 }}>
          Usamos cookies técnicas y analíticas (Google Analytics) para mejorar tu experiencia.{" "}
          <Link href="/privacidad" style={{ color: "var(--gold)", textDecoration: "none" }}>
            Política de privacidad
          </Link>
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={accept}
          style={{
            padding: "0.55rem 1.25rem", borderRadius: 8, fontSize: "0.78rem", fontWeight: 700,
            background: "var(--gold)", color: "#05051a", border: "none", cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
          Aceptar
        </button>
        <button onClick={reject}
          style={{
            padding: "0.55rem 1.25rem", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600,
            background: "transparent", color: "#52525b", border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer", transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
          Solo necesarias
        </button>
      </div>
    </div>
  );
}
