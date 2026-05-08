"use client";

const REVIEWS = [
  { name: "Sofía R.",    event: "Quinceañera",   stars: 5, text: "¡Todo perfecto! El DJ estuvo increíble toda la noche y la iluminación dejó a todos con la boca abierta. Superaron nuestras expectativas.", initial: "S", color: "#a855f7" },
  { name: "Carlos M.",   event: "Boda",          stars: 5, text: "Profesionales desde el primer contacto. El show robot LED fue lo más comentado de la noche. Los 500 invitados quedaron encantados.", initial: "C", color: "#f59e0b" },
  { name: "Daniela V.",  event: "Cumpleaños VIP", stars: 5, text: "Contratamos el paquete Diamante y valió cada peso. El vals en las nubes fue mágico y la pirotecnia fría emocionó a todos.", initial: "D", color: "#f472b6" },
  { name: "Ing. Torres", event: "Evento Corporativo", stars: 5, text: "Muy puntuales y profesionales. El audio llegó al 100% del salón sin problemas. Definitivamente los volveremos a contratar.", initial: "T", color: "#38bdf8" },
];

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? "#f59e0b" : "#334155", fontSize: "0.85rem" }}>★</span>
      ))}
    </div>
  );
}

export default function Testimonials({ whatsappNumber = "524929496372" }: { whatsappNumber?: string }) {
  return (
    <section style={{ padding: "4rem 1.25rem 5rem", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(0,0,0,.2)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p className="section-label" style={{ textAlign: "center" }}>Lo que dicen nuestros clientes</p>
        <h2 className="section-title bebas" style={{ textAlign: "center", marginBottom: "3rem" }}>
          Reseñas reales
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {REVIEWS.map((r) => (
            <div key={r.name}
              className="aura-card"
              style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${r.color}, ${r.color}80)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, color: "#fff", fontSize: "1.1rem",
                }}>
                  {r.initial}
                </div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{r.name}</p>
                  <p style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{r.event}</p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Stars n={r.stars} />
                </div>
              </div>
              {/* Quote */}
              <p style={{ color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.65, fontStyle: "italic" }}>
                &ldquo;{r.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* CTA debajo */}
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola, me interesa cotizar un evento 🎉")}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-gold" style={{ textDecoration: "none", display: "inline-block" }}>
            ✦ Sé el próximo evento legendario
          </a>
        </div>
      </div>
    </section>
  );
}
