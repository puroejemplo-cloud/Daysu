"use client";
import type { PlaceInfo, GoogleReview } from "@/lib/google-places";
import Image from "next/image";

const STATIC_REVIEWS = [
  { name: "Sofía R.",    event: "Quinceañera",        stars: 5, text: "¡Todo perfecto! El DJ estuvo increíble toda la noche y la iluminación dejó a todos con la boca abierta. Superaron nuestras expectativas.", initial: "S", color: "#a855f7" },
  { name: "Carlos M.",   event: "Boda",               stars: 5, text: "Profesionales desde el primer contacto. El show robot LED fue lo más comentado de la noche. Los 500 invitados quedaron encantados.", initial: "C", color: "#f59e0b" },
  { name: "Daniela V.",  event: "Cumpleaños VIP",     stars: 5, text: "Contratamos el paquete Diamante y valió cada peso. El vals en las nubes fue mágico y la pirotecnia fría emocionó a todos.", initial: "D", color: "#f472b6" },
  { name: "Ing. Torres", event: "Evento Corporativo", stars: 5, text: "Muy puntuales y profesionales. El audio llegó al 100% del salón sin problemas. Definitivamente los volveremos a contratar.", initial: "T", color: "#38bdf8" },
];

const ACCENT_COLORS = ["#a855f7", "#f59e0b", "#f472b6", "#38bdf8", "#4ade80", "#fb923c"];
function colorFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return ACCENT_COLORS[Math.abs(h) % ACCENT_COLORS.length];
}

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? "#f59e0b" : "#334155", fontSize: "0.85rem" }}>★</span>
      ))}
    </div>
  );
}

function GoogleAvatar({ review }: { review: GoogleReview }) {
  const color = colorFromName(review.author_name);
  const initial = review.author_name.charAt(0).toUpperCase();
  if (review.profile_photo_url) {
    return (
      <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `2px solid ${color}40` }}>
        <Image
          src={review.profile_photo_url}
          alt={review.author_name}
          width={44} height={44}
          style={{ objectFit: "cover" }}
          unoptimized
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    );
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${color}80)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, color: "#fff", fontSize: "1.1rem",
    }}>
      {initial}
    </div>
  );
}

export default function Testimonials({
  whatsappNumber = "524929496372",
  placeInfo,
}: {
  whatsappNumber?: string;
  placeInfo?: PlaceInfo | null;
}) {
  const hasGoogle = placeInfo && placeInfo.reviews.length > 0;

  return (
    <section style={{ padding: "4rem 1.25rem 5rem", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(0,0,0,.2)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p className="section-label" style={{ textAlign: "center" }}>Lo que dicen nuestros clientes</p>
        <h2 className="section-title bebas" style={{ textAlign: "center", marginBottom: hasGoogle ? "1rem" : "3rem" }}>
          Reseñas reales
        </h2>

        {/* Badge de rating de Google */}
        {hasGoogle && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "0.4rem 1rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.95rem" }}>
                {placeInfo.rating.toFixed(1)}
              </span>
              <Stars n={Math.round(placeInfo.rating)} />
              <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                {placeInfo.user_ratings_total} reseñas
              </span>
            </div>
          </div>
        )}

        {/* Grid de reseñas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {hasGoogle
            ? placeInfo.reviews.map((r) => (
                <div key={r.author_name + r.text.slice(0, 20)}
                  className="aura-card"
                  style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <GoogleAvatar review={r} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.author_name}</p>
                      <p style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{r.relative_time_description}</p>
                    </div>
                    <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                      <Stars n={r.rating} />
                    </div>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.65, fontStyle: "italic" }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                </div>
              ))
            : STATIC_REVIEWS.map((r) => (
                <div key={r.name}
                  className="aura-card"
                  style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                  <p style={{ color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.65, fontStyle: "italic" }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                </div>
              ))
          }
        </div>

        {/* CTAs */}
        <div style={{ textAlign: "center", marginTop: "2.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {hasGoogle && (
            <a href="https://maps.app.goo.gl/jECw9oHjjJikhovE8"
              target="_blank" rel="noopener noreferrer"
              className="btn-ghost"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Ver todas en Google
            </a>
          )}
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
