import Link from "next/link";
import Image from "next/image";
import type { ServicePageConfig } from "@/lib/service-pages";
import { SERVICE_PAGES } from "@/lib/service-pages";

export interface ServicePackage {
  id: number;
  name: string;
  sku: string;
  dailyRate: string;
  description: string | null;
  imageUrl: string | null;
  componentNames: string[];
}

interface ServicePageProps {
  config: ServicePageConfig;
  packages: ServicePackage[];
  /** true cuando los paquetes mostrados son los generales (el servicio no tiene
   *  activos propios en BD) y deben presentarse como base para agregar el servicio */
  isFallback?: boolean;
  waNumber: string;
}

export default function ServicePage({ config, packages, isFallback = false, waNumber }: ServicePageProps) {
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola, me interesa: ${config.h1}`)}`;

  return (
    <article style={{ color: "var(--cream)", maxWidth: "80rem", margin: "0 auto", padding: "0 1.25rem" }}>

      {/* Hero */}
      <section style={{ paddingTop: "5rem", paddingBottom: "3rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "1rem" }}>
          Zacatecas, México
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "1.25rem", lineHeight: 1.1 }}>
          {config.h1}
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: "42rem", margin: "0 auto 2rem" }}>
          {config.subtitle}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/reservar" className="btn-gold"
            style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", fontWeight: 700, textDecoration: "none" }}>
            Reservar ahora
          </Link>
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.15)", color: "var(--cream)", textDecoration: "none", fontWeight: 500 }}>
            WhatsApp
          </a>
        </div>
      </section>

      {/* Packages */}
      {packages.length > 0 && (
        <section style={{ paddingBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: isFallback ? "0.5rem" : "1.5rem", textAlign: "center" }}>
            {isFallback ? "Agrégalo a cualquiera de nuestros paquetes" : "Paquetes disponibles"}
          </h2>
          {isFallback && (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", textAlign: "center", maxWidth: "38rem", margin: "0 auto 1.5rem" }}>
              Este servicio se cotiza como complemento de tu evento.{" "}
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
                Pide tu cotización por WhatsApp
              </a>{" "}
              o súmalo a uno de estos paquetes:
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {packages.map((pkg) => (
              <Link key={pkg.id} href={`/catalogo/${pkg.sku.toLowerCase()}`} style={{ textDecoration: "none" }}>
                <div className="aura-card" style={{ padding: "1.25rem", borderRadius: "0.75rem", cursor: "pointer", height: "100%" }}>
                  {pkg.imageUrl && (
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", marginBottom: "1rem", borderRadius: "0.5rem", overflow: "hidden" }}>
                      <Image
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--cream)" }}>
                    {pkg.name}
                  </h3>
                  <p style={{ fontSize: "1.25rem", fontWeight: 300, color: "var(--gold)", marginBottom: "0.5rem" }}>
                    ${Number(pkg.dailyRate).toLocaleString("es-MX")}{" "}
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>MXN</span>
                  </p>
                  {pkg.componentNames.length > 0 && (
                    <ul style={{ fontSize: "0.75rem", color: "var(--muted)", listStyle: "none", padding: 0, margin: 0 }}>
                      {pkg.componentNames.slice(0, 4).map((c) => (
                        <li key={c} style={{ marginBottom: "0.2rem" }}>· {c}</li>
                      ))}
                      {pkg.componentNames.length > 4 && (
                        <li style={{ color: "var(--gold)" }}>+ {pkg.componentNames.length - 4} más</li>
                      )}
                    </ul>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section style={{ paddingBottom: "3rem", maxWidth: "42rem", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1.5rem", textAlign: "center" }}>
          ¿Por qué elegirnos?
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {config.features.map((feature) => (
            <li key={feature} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ color: "var(--cream)" }}>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA final */}
      <section style={{ paddingBottom: "5rem", textAlign: "center" }}>
        <div className="admin-surface"
          style={{ padding: "2rem", borderRadius: "1rem", display: "inline-block", maxWidth: "36rem", width: "100%" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 500, marginBottom: "0.5rem" }}>
            ¿Listo para reservar?
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            Aparta tu fecha con solo el 30% de depósito
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/reservar" className="btn-gold"
              style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", fontWeight: 700, textDecoration: "none" }}>
              Reservar ahora
            </Link>
            <Link href="/catalogo"
              style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.15)", color: "var(--cream)", textDecoration: "none" }}>
              Ver todos los paquetes
            </Link>
          </div>
        </div>
      </section>

      {/* Otros servicios */}
      <section style={{ paddingBottom: "4rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "2.5rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "1rem" }}>
          Otros servicios en Zacatecas
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem" }}>
          {SERVICE_PAGES.filter((p) => p.slug !== config.slug).map((p) => (
            <Link key={p.slug} href={`/servicios/${p.slug}`}
              style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none" }}>
              {p.h1.replace(" en Zacatecas", "")}
            </Link>
          ))}
        </div>
      </section>

    </article>
  );
}
