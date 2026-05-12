interface WeddingGalleryProps {
  images: string[]; // full URLs
}

export function WeddingGallery({ images }: WeddingGalleryProps) {
  if (!images.length) return null;

  return (
    <section className="py-16 px-4" style={{ background: "var(--black)" }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-center text-3xl font-semibold mb-10"
          style={{ color: "var(--cream)" }}
        >
          Eventos que hemos creado
        </h2>

        <div
          style={{
            columns: "2 280px",
            gap: "0.75rem",
          }}
        >
          {images.map((url, i) => (
            <div
              key={i}
              style={{
                breakInside: "avoid",
                marginBottom: "0.75rem",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              <img
                src={url}
                alt={`Evento ${i + 1}`}
                style={{ width: "100%", display: "block", objectFit: "cover" }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
