import { ImageResponse } from "next/og";

export const runtime     = "edge";
export const alt         = "Daysu.vip — Eventos Legendarios en Zacatecas";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#05051a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Círculos decorativos de fondo */}
        <div style={{
          position: "absolute", top: -120, right: -80,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,25,138,0.12) 0%, transparent 70%)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute", bottom: -100, left: -60,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* Nombre */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 4,
          marginBottom: 20,
        }}>
          <span style={{
            fontSize: 112,
            fontWeight: 900,
            color: "#f5f0e8",
            letterSpacing: "-3px",
            lineHeight: 1,
          }}>
            DAYSU
          </span>
          <span style={{
            fontSize: 112,
            fontWeight: 900,
            color: "#E8198A",
            letterSpacing: "-3px",
            lineHeight: 1,
          }}>
            .VIP
          </span>
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 28,
          color: "#a1a1aa",
          fontWeight: 400,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 48,
        }}>
          Eventos Legendarios · Zacatecas
        </div>

        {/* Chips de servicios */}
        <div style={{ display: "flex", gap: 14 }}>
          {["Bodas", "XV Años", "Fiestas", "Corporativos"].map((s) => (
            <div
              key={s}
              style={{
                background: "rgba(232,25,138,0.1)",
                border: "1px solid rgba(232,25,138,0.3)",
                borderRadius: 32,
                padding: "10px 22px",
                fontSize: 22,
                color: "#f5f0e8",
                fontWeight: 500,
                display: "flex",
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Línea de acento inferior */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 5,
          background: "linear-gradient(90deg, transparent 0%, #E8198A 30%, #FF3DA8 50%, #E8198A 70%, transparent 100%)",
          display: "flex",
        }} />

        {/* URL */}
        <div style={{
          position: "absolute", bottom: 20, right: 40,
          fontSize: 20, color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.05em",
        }}>
          daysu.vip
        </div>
      </div>
    ),
    { ...size }
  );
}
