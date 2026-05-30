import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_PAGES } from "@/lib/service-pages";

export const metadata: Metadata = {
  title: "Servicios para Eventos en Zacatecas",
  description: "DJ, sonido, iluminación, shows y más para bodas, XV años, graduaciones y fiestas en Zacatecas. Reserva en línea con el 30% de depósito.",
};

export default function ServiciosPage() {
  return (
    <div style={{ color: "var(--cream)", maxWidth: "80rem", margin: "0 auto", padding: "5rem 1.25rem 6rem" }}>
      <header style={{ textAlign: "center", marginBottom: "4rem" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "1rem" }}>
          Zacatecas, México
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "1.25rem", lineHeight: 1.1 }}>
          Servicios para Eventos en Zacatecas
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: "42rem", margin: "0 auto" }}>
          Todo lo que necesitas para tu evento: DJ, sonido, iluminación, cabina de fotos, show robot y más. Servicio profesional con reserva en línea.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {SERVICE_PAGES.map((p) => (
          <Link key={p.slug} href={`/servicios/${p.slug}`} style={{ textDecoration: "none" }}>
            <article className="aura-card" style={{ padding: "1.5rem", borderRadius: "0.75rem", height: "100%", cursor: "pointer" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--cream)" }}>
                {p.h1}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>
                {p.metaDescription}
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--gold)", fontWeight: 700, marginTop: "1rem" }}>
                Ver paquetes →
              </p>
            </article>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <Link href="/reservar" className="btn-gold"
          style={{ padding: "0.875rem 2.5rem", borderRadius: "0.5rem", fontWeight: 700, textDecoration: "none" }}>
          Cotizar mi evento
        </Link>
      </div>
    </div>
  );
}
