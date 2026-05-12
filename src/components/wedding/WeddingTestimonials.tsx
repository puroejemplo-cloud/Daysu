interface Testimonial {
  name: string;
  eventType: string;
  text: string;
}

interface WeddingTestimonialsProps {
  testimonials: Testimonial[];
}

export function WeddingTestimonials({ testimonials }: WeddingTestimonialsProps) {
  if (!testimonials.length) return null;

  return (
    <section className="py-16 px-4" style={{ background: "var(--black)" }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-center text-3xl font-semibold mb-10"
          style={{ color: "var(--cream)" }}
        >
          Lo que dicen nuestros clientes
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="aura-card p-6 rounded-xl"
            >
              <p
                className="text-base mb-4 italic"
                style={{ color: "var(--cream)", lineHeight: 1.7 }}
              >
                "{t.text}"
              </p>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--gold)" }}>
                  {t.name}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {t.eventType}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
