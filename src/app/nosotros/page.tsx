import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nosotros — Aura Producciones",
  description: "Conoce al equipo detrás de Daysu.vip. Más de 8 años haciendo eventos legendarios en Zacatecas: bodas, quinceañeras, cumpleaños y eventos corporativos.",
  alternates: { canonical: "https://daysu.vip/nosotros" },
  openGraph: {
    title: "Nosotros — Daysu.vip",
    description: "8+ años haciendo eventos legendarios en Zacatecas.",
    images: [{ url: "https://daysu.vip/api/og?title=Aura+Producciones%0A8%2B+a%C3%B1os+de+eventos", width: 1200, height: 630 }],
  },
};

const VALUES = [
  { icon: "🎯", title: "Profesionalismo", desc: "Cada evento se planea con meses de anticipación. Llegamos puntual, instalamos en tiempo y cumplimos lo prometido — siempre." },
  { icon: "🎨", title: "Creatividad", desc: "No hay dos eventos iguales. Personalizamos cada paquete según el estilo de la familia, la música favorita y la visión del cliente." },
  { icon: "🔊", title: "Calidad de equipo", desc: "Invertimos en equipo de audio e iluminación profesional. El sonido que escuchan tus invitados refleja la calidad de tu evento." },
  { icon: "🤝", title: "Confianza", desc: "Operamos con contrato formal, depósito documentado y comunicación constante. Nunca desaparecemos después de cobrar." },
];

const MILESTONES = [
  { year: "2016", text: "Primer evento — una quinceañera en Guadalupe, Zacatecas. Equipo prestado, mucha ilusión." },
  { year: "2018", text: "Primeros 50 eventos. Compramos nuestro primer sistema de audio profesional." },
  { year: "2020", text: "Pandemia. Adaptamos el negocio a eventos íntimos y transmisiones en vivo." },
  { year: "2022", text: "Incorporamos el show de Robot LED — se convierte en el servicio más solicitado." },
  { year: "2024", text: "Más de 400 eventos realizados. Lanzamos Daysu.vip con reservas en línea." },
  { year: "2026", text: "Hoy: 500+ eventos, equipo completo y la misma pasión del primer día." },
];

export default function NosotrosPage() {
  return (
    <div style={{ minHeight: "100vh", color: "var(--cream)" }}>

      {/* Hero */}
      <section style={{ padding: "5rem 1.25rem 4rem", position: "relative", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,25,138,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <p className="section-label" style={{ position: "relative" }}>Aura Producciones</p>
        <h1 className="bebas section-title" style={{ position: "relative", marginTop: "0.5rem", fontSize: "clamp(2.5rem,6vw,5rem)" }}>
          Hacemos eventos{" "}
          <em style={{ background: "linear-gradient(135deg, var(--gold), var(--gold2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "italic" }}>
            legendarios
          </em>
        </h1>
        <p style={{ position: "relative", color: "#64748b", fontSize: "1rem", marginTop: "1rem", maxWidth: 520, margin: "1rem auto 0", lineHeight: 1.7 }}>
          Somos un equipo de Zacatecas con más de 8 años transformando bodas, quinceañeras y fiestas en memorias que duran toda la vida.
        </p>
      </section>

      {/* Stats */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0" }}>
          {[
            { num: "8+",   label: "Años de experiencia" },
            { num: "500+", label: "Eventos realizados"  },
            { num: "500+", label: "Invitados máx."      },
            { num: "100%", label: "Compromiso"          },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "1.5rem 1rem", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <p className="bebas" style={{ fontSize: "clamp(2.2rem,5vw,3.5rem)", color: "var(--gold)", lineHeight: 1 }}>{s.num}</p>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginTop: "0.4rem" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historia */}
      <section style={{ padding: "5rem 1.25rem", maxWidth: 800, margin: "0 auto" }}>
        <p className="section-label">Nuestra historia</p>
        <h2 className="bebas section-title" style={{ marginTop: "0.5rem", marginBottom: "3rem" }}>De Guadalupe al mundo</h2>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "3.5rem", top: 0, bottom: 0, width: 1, background: "rgba(232,25,138,0.15)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {MILESTONES.map((m) => (
              <div key={m.year} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, textAlign: "center", width: "5rem" }}>
                  <span className="bebas" style={{ fontSize: "1.3rem", color: "var(--gold)", letterSpacing: "0.05em" }}>{m.year}</span>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", padding: "1rem 1.25rem" }}>
                  <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7 }}>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section style={{ padding: "0 1.25rem 5rem", maxWidth: 1000, margin: "0 auto" }}>
        <p className="section-label" style={{ textAlign: "center" }}>Lo que nos define</p>
        <h2 className="bebas section-title" style={{ textAlign: "center", marginTop: "0.5rem", marginBottom: "3rem" }}>Nuestros valores</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {VALUES.map((v) => (
            <div key={v.title} style={{ background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <span style={{ fontSize: "2rem" }}>{v.icon}</span>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f4f4f5" }}>{v.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "#71717a", lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "4rem 1.25rem 5rem", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 className="bebas" style={{ fontSize: "clamp(2rem,4vw,3rem)", marginBottom: "1rem" }}>¿Platicamos sobre tu evento?</h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "2rem" }}>Sin compromiso. Solo cuéntanos qué tienes en mente.</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/reservar" className="btn-gold" style={{ textDecoration: "none" }}>Cotizar mi evento →</Link>
          <Link href="/contacto" className="btn-ghost" style={{ textDecoration: "none", fontSize: "0.82rem" }}>Enviar mensaje</Link>
        </div>
      </section>
    </div>
  );
}
