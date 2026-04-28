"use client";

const EVENTS = [
  { type: "Boda",            emoji: "💍", color: "#f59e0b", img: null },
  { type: "Quinceañera",     emoji: "👑", color: "#a855f7", img: null },
  { type: "Cumpleaños VIP",  emoji: "🎂", color: "#f472b6", img: null },
  { type: "Evento Corporativo", emoji: "🏢", color: "#38bdf8", img: null },
  { type: "Graduación",      emoji: "🎓", color: "#34d399", img: null },
  { type: "Bautizo",         emoji: "🕊️", color: "#c084fc", img: null },
];

export default function Gallery() {
  return (
    <section style={{ padding: "4rem 1.25rem 5rem", borderTop: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p className="section-label" style={{ textAlign: "center" }}>Nuestros eventos</p>
        <h2 className="section-title bebas" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          Momentos<br />
          <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Legendarios</em>
        </h2>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.88rem", marginBottom: "3rem" }}>
          Especializados en bodas, quinceañeras, cumpleaños y eventos corporativos en Zacatecas.
        </p>

        {/* Grid de tipos de evento */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {EVENTS.map((ev) => (
            <div key={ev.type}
              style={{
                background: `linear-gradient(135deg, ${ev.color}18, ${ev.color}08)`,
                border: `1px solid ${ev.color}30`,
                borderRadius: 12,
                padding: "1.5rem 1rem",
                textAlign: "center",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${ev.color}25`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.6rem", lineHeight: 1 }}>{ev.emoji}</div>
              <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.88rem" }}>{ev.type}</p>
            </div>
          ))}
        </div>

        {/* CTA redes sociales */}
        <div style={{ textAlign: "center", padding: "2rem", borderRadius: 16, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
            Síguenos para ver eventos reales y más contenido
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Instagram", icon: "📸", href: "https://instagram.com" },
              { label: "TikTok",    icon: "🎵", href: "https://tiktok.com"    },
              { label: "Facebook",  icon: "👥", href: "https://facebook.com"  },
            ].map((sn) => (
              <a key={sn.label} href={sn.href} target="_blank" rel="noopener noreferrer"
                className="btn-ghost"
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                {sn.icon} {sn.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
