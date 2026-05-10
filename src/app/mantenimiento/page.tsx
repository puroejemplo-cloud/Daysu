import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitio en Mantenimiento — Daysu.vip",
  description: "Estamos mejorando nuestro sitio. Volvemos pronto.",
};

export default function MantenimientoPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;700&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .maintenance-float { animation: float 4s ease-in-out infinite; }
        .maintenance-glow  { animation: pulse-glow 3s ease-in-out infinite; }
        .maintenance-spin  { animation: spin-slow 12s linear infinite; }
        .maintenance-fade1 { animation: fade-up 0.6s ease forwards; }
        .maintenance-fade2 { animation: fade-up 0.6s ease 0.15s both; }
        .maintenance-fade3 { animation: fade-up 0.6s ease 0.3s both; }
        .maintenance-fade4 { animation: fade-up 0.6s ease 0.45s both; }
        .maintenance-ticker { animation: ticker 20s linear infinite; }

        .maint-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(232,25,138,0.5); }
        .maint-btn { transition: transform 0.2s, box-shadow 0.2s; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#05051a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Radial glows de fondo */}
        <div className="maintenance-glow" style={{
          position: "absolute", top: "-10%", left: "50%",
          transform: "translateX(-50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse, rgba(232,25,138,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "-5%",
          width: 400, height: 400,
          background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Círculo decorativo giratorio */}
        <div className="maintenance-spin" style={{
          position: "absolute",
          width: 480, height: 480,
          border: "1px solid rgba(232,25,138,0.08)",
          borderRadius: "50%",
          pointerEvents: "none",
        }} />
        <div className="maintenance-spin" style={{
          position: "absolute",
          width: 340, height: 340,
          border: "1px dashed rgba(232,25,138,0.06)",
          borderRadius: "50%",
          animationDirection: "reverse",
          pointerEvents: "none",
        }} />

        {/* Contenido principal */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 560 }}>

          {/* Ícono flotante */}
          <div className="maintenance-float maintenance-fade1" style={{ marginBottom: "2rem" }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%", margin: "0 auto",
              background: "linear-gradient(135deg, rgba(232,25,138,0.2), rgba(124,58,237,0.2))",
              border: "1.5px solid rgba(232,25,138,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.2rem",
              boxShadow: "0 0 40px rgba(232,25,138,0.2)",
            }}>
              ⚙️
            </div>
          </div>

          {/* Logo */}
          <p className="maintenance-fade1" style={{
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.35em",
            color: "#E8198A", textTransform: "uppercase", marginBottom: "0.75rem",
          }}>
            Daysu.vip · Eventos Legendarios
          </p>

          {/* Título */}
          <h1 className="maintenance-fade2" style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(3rem, 10vw, 5.5rem)",
            lineHeight: 1,
            color: "#f4f4f5",
            letterSpacing: "0.03em",
            marginBottom: "1rem",
          }}>
            En Mantenimiento
          </h1>

          {/* Línea decorativa */}
          <div className="maintenance-fade2" style={{
            width: 80, height: 3, margin: "0 auto 1.5rem",
            background: "linear-gradient(90deg, transparent, #E8198A, transparent)",
          }} />

          {/* Descripción */}
          <p className="maintenance-fade3" style={{
            fontSize: "1rem", color: "#a1a1aa", lineHeight: 1.7,
            marginBottom: "2.5rem", maxWidth: 440, margin: "0 auto 2.5rem",
          }}>
            Estamos haciendo mejoras para ofrecerte la mejor experiencia.<br />
            Volvemos muy pronto con todo listo para tu evento.
          </p>

          {/* Tarjeta de estado */}
          <div className="maintenance-fade3" style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(232,25,138,0.15)",
            borderRadius: 16,
            padding: "1.25rem 1.75rem",
            marginBottom: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#f59e0b",
              boxShadow: "0 0 10px rgba(245,158,11,0.6)",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.85rem", color: "#d4d4d8" }}>
              Tiempo estimado de regreso: <strong style={{ color: "#f4f4f5" }}>muy pronto</strong>
            </span>
          </div>

          {/* CTA WhatsApp */}
          <div className="maintenance-fade4">
            <a
              href="https://wa.me/529491234567?text=Hola%2C+vi+que+el+sitio+está+en+mantenimiento.+¿Cuándo+estará+disponible%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="maint-btn"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.6rem",
                padding: "0.75rem 2rem",
                background: "linear-gradient(135deg, #E8198A, #FF3DA8)",
                color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                textDecoration: "none", borderRadius: 999,
                boxShadow: "0 4px 20px rgba(232,25,138,0.35)",
                letterSpacing: "0.03em",
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contáctanos por WhatsApp
            </a>
          </div>

        </div>

        {/* Ticker inferior */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "0.6rem 0",
          background: "rgba(232,25,138,0.08)",
          borderTop: "1px solid rgba(232,25,138,0.12)",
          overflow: "hidden",
        }}>
          <div className="maintenance-ticker" style={{
            display: "flex", whiteSpace: "nowrap", gap: "3rem",
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em",
            color: "rgba(232,25,138,0.6)", textTransform: "uppercase",
          }}>
            {Array.from({ length: 2 }, (_, i) => (
              <span key={i} style={{ display: "flex", gap: "3rem" }}>
                {["BODAS", "XV AÑOS", "CUMPLEAÑOS VIP", "EVENTOS CORPORATIVOS", "ZACATECAS", "SONIDO PROFESIONAL", "DJ VERSÁTIL", "ROBOT LED", "CABEZONES", "PIROTECNIA"].map((item) => (
                  <span key={item}>✦ {item}</span>
                ))}
              </span>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
