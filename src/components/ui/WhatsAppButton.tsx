"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const DEFAULT_NUMBER = "524929496372";
const DEFAULT_MSG    = "Hola, me interesa cotizar un paquete para mi evento 🎉";

export default function WhatsAppButton({
  number  = DEFAULT_NUMBER,
  message = DEFAULT_MSG,
}: {
  number?: string;
  message?: string;
}) {
  const pathname  = usePathname();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Ciclo: muestra texto 1s → oculta → espera 30s → repite
    let t: ReturnType<typeof setTimeout>;

    const cycle = () => {
      setExpanded(true);
      t = setTimeout(() => {
        setExpanded(false);
        t = setTimeout(cycle, 30_000);
      }, 1_000);
    };

    // Primer disparo con un pequeño delay para que no aparezca antes de que cargue la página
    t = setTimeout(cycle, 800);
    return () => clearTimeout(t);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin") || pathname === "/login")
    return null;

  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      aria-label="Cotizar por WhatsApp"
      className="whatsapp-float"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        background: "#25D366",
        color: "#fff",
        borderRadius: 999,
        padding: expanded ? "0.7rem 1.25rem 0.7rem 1rem" : "0.7rem",
        boxShadow: "0 4px 24px rgba(37,211,102,.5), 0 1px 4px rgba(0,0,0,.3)",
        textDecoration: "none",
        fontFamily: "var(--font-dm, sans-serif)",
        fontWeight: 700,
        fontSize: "0.88rem",
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        overflow: "hidden",
        transition: "padding 0.35s cubic-bezier(.25,.46,.45,.94)",
      }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
      <span style={{
        maxWidth:   expanded ? 160 : 0,
        opacity:    expanded ? 1   : 0,
        marginLeft: expanded ? "0.55rem" : 0,
        overflow: "hidden",
        transition: "max-width 0.35s cubic-bezier(.25,.46,.45,.94), opacity 0.3s ease, margin-left 0.35s ease",
      }}>
        Cotizar Ahora
      </span>
    </a>
  );
}
