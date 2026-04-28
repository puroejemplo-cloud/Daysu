import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: "80vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", textAlign: "center",
    }}>
      {/* Número decorativo */}
      <div aria-hidden="true" style={{
        fontFamily: "var(--font-bebas)", fontSize: "clamp(7rem,20vw,14rem)",
        lineHeight: 1, color: "rgba(201,168,76,0.08)", userSelect: "none",
        marginBottom: "-2rem",
      }}>
        404
      </div>

      {/* Logo */}
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "var(--gold)", color: "#05051a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: "1.4rem",
        boxShadow: "0 0 24px rgba(201,168,76,.35)",
        marginBottom: "1.5rem",
      }} aria-hidden="true">A</div>

      <p className="section-label" style={{ marginBottom: "0.75rem" }}>Error 404</p>
      <h1 className="bebas" style={{
        fontSize: "clamp(2rem,6vw,3.5rem)", color: "var(--cream)",
        lineHeight: 1, marginBottom: "1rem",
      }}>
        Esta página no existe
      </h1>
      <p style={{
        color: "var(--muted)", fontSize: "0.9rem", maxWidth: 380,
        lineHeight: 1.7, marginBottom: "2.5rem",
      }}>
        La página que buscas no se encontró. Puede que haya sido movida o el enlace esté incorrecto.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn-gold" style={{ textDecoration: "none", fontSize: "0.82rem" }}>
          Ir al inicio →
        </Link>
        <Link href="/catalogo" className="btn-ghost" style={{ textDecoration: "none", fontSize: "0.82rem" }}>
          Ver paquetes
        </Link>
      </div>
    </div>
  );
}
