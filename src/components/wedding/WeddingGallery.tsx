"use client";

interface WeddingGalleryProps {
  images: string[];
}

export function WeddingGallery({ images }: WeddingGalleryProps) {
  return (
    <section className="py-16 px-4" style={{ background: "var(--black)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p className="text-center text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--gold)" }}>
          NUESTRO TRABAJO
        </p>
        <h2 className="text-center text-3xl font-semibold mb-3" style={{ color: "var(--cream)" }}>
          Eventos que hemos creado
        </h2>
        <p className="text-center text-sm mb-10 max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
          Cada evento es único. Aquí una muestra de lo que podemos hacer por ti.
        </p>

        {images.length === 0 ? (
          /* Placeholder cuando no hay fotos configuradas */
          <div style={{
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: "1rem",
            padding: "3rem 2rem",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📸</p>
            <p style={{ color: "var(--cream)", fontWeight: 500, marginBottom: 6 }}>Galería en preparación</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              Pronto verás aquí una selección de nuestros eventos más memorables.
            </p>
          </div>
        ) : (
          <div style={{ columns: "2 280px", gap: "0.625rem" }}>
            {images.map((url, i) => (
              <div
                key={i}
                className="wp-gallery-item"
                style={{
                  breakInside: "avoid",
                  marginBottom: "0.625rem",
                  borderRadius: "0.625rem",
                  overflow: "hidden",
                  position: "relative",
                  cursor: "zoom-in",
                }}
              >
                <img
                  src={url}
                  alt={`Evento ${i + 1}`}
                  style={{ width: "100%", display: "block", objectFit: "cover", transition: "transform 0.4s ease" }}
                  loading="lazy"
                />
                <div className="wp-gallery-overlay" style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(5,5,26,0.5) 0%, transparent 50%)",
                  opacity: 0, transition: "opacity 0.3s ease",
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .wp-gallery-item:hover img { transform: scale(1.04); }
        .wp-gallery-item:hover .wp-gallery-overlay { opacity: 1; }
      `}</style>
    </section>
  );
}
