import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { extname, basename } from "path";

export const metadata: Metadata = {
  title: "Galería de Eventos",
  description: "Fotos reales de bodas, quinceañeras y eventos en Zacatecas. Así se viven los eventos con Daysu.vip.",
  openGraph: {
    title: "Galería — Daysu.vip",
    description: "Momentos legendarios captados en nuestros eventos.",
    images: [{ url: "https://daysu.vip/api/og?title=Galería+de+Eventos+Legendarios", width: 1200, height: 630 }],
  },
};

export const revalidate = 300;

function toWebpName(name: string): string {
  return basename(name, extname(name))
    .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "") + ".webp";
}

async function loadGalleryImages(): Promise<{ src: string; alt: string }[]> {
  try {
    const { list } = await import("@vercel/blob");
    const [orderBlobs, procBlobs] = await Promise.all([
      list({ prefix: "galeria/config/order.json" }).then((r) => r.blobs),
      list({ prefix: "galeria/processed/" }).then((r) => r.blobs),
    ]);

    const procMap = new Map(
      procBlobs.map((b) => [b.pathname.slice("galeria/processed/".length), b.url])
    );

    // Try to use order config
    let names: string[] = [];
    const orderBlob = orderBlobs.find((b) => b.pathname === "galeria/config/order.json");
    if (orderBlob) {
      const res = await fetch(orderBlob.url, { cache: "no-store" });
      if (res.ok) names = await res.json();
    }

    // If no order, use all processed images
    if (!names.length) {
      names = [...procMap.keys()].map((webp) => webp.replace(/\.webp$/, ""));
    }

    return names
      .map((name) => {
        const url = procMap.get(toWebpName(name));
        if (!url) return null;
        return {
          src: url,
          alt: basename(name, extname(name))
            .replace(/[-_]/g, " ").replace(/\s+/g, " ").trim()
            .replace(/^\w/, (c) => c.toUpperCase()),
        };
      })
      .filter((x): x is { src: string; alt: string } => x !== null);
  } catch {
    return [];
  }
}

export default async function GaleriaPage() {
  const images = await loadGalleryImages();

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", color: "var(--cream)" }}>
      {/* Header */}
      <div style={{ padding: "5rem 1.25rem 3rem", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,25,138,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <p className="section-label" style={{ position: "relative" }}>Nuestros eventos</p>
        <h1 className="bebas section-title" style={{ position: "relative", marginTop: "0.5rem" }}>
          Galería{" "}
          <em style={{ background: "linear-gradient(135deg, var(--gold), var(--gold2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "italic" }}>
            Legendaria
          </em>
        </h1>
        <p style={{ position: "relative", color: "#64748b", fontSize: "0.9rem", marginTop: "0.75rem", maxWidth: 420, margin: "0.75rem auto 0" }}>
          Fotos reales de bodas, quinceañeras y eventos en Zacatecas.
        </p>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.25rem 5rem" }}>
        {images.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 1rem", color: "#3f3f46" }}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>📸</p>
            <p style={{ fontSize: "0.9rem" }}>Galería en construcción. Vuelve pronto.</p>
          </div>
        ) : (
          <div style={{
            columns: "2 280px",
            columnGap: "0.75rem",
            gap: "0.75rem",
          }}>
            {images.map((img, i) => (
              <div key={i} style={{
                breakInside: "avoid",
                marginBottom: "0.75rem",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#0d0d1a",
                position: "relative",
                transition: "transform 0.2s, border-color 0.2s",
              }}
              className="gallery-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  loading={i < 6 ? "eager" : "lazy"}
                  decoding="async"
                  style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                />
                {img.alt && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                    padding: "2rem 0.875rem 0.75rem",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  className="gallery-caption">
                    <p style={{ color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}>{img.alt}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "3.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/reservar" className="btn-gold" style={{ textDecoration: "none" }}>
            Quiero un evento así →
          </Link>
          <Link href="/catalogo" className="btn-ghost" style={{ textDecoration: "none", fontSize: "0.82rem" }}>
            Ver paquetes
          </Link>
        </div>
      </div>
    </div>
  );
}
