import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#05051a",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Fondo radial rosa */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            width: "700px",
            height: "700px",
            marginLeft: "-350px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,25,138,0.18) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Línea acento superior */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background:
              "linear-gradient(90deg, transparent 0%, #E8198A 40%, #FF3DA8 60%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Logo + nombre */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            marginBottom: "20px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://daysu.vip/logo-daysu.png"
            width={100}
            height={100}
            alt="Daysu"
            style={{ objectFit: "contain", borderRadius: "16px" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "82px",
                fontWeight: 900,
                color: "#f5f0e8",
                letterSpacing: "-3px",
                lineHeight: 1,
              }}
            >
              Daysu
              <span style={{ color: "#E8198A" }}>.vip</span>
            </span>
          </div>
        </div>

        {/* Subtítulo */}
        <div
          style={{
            fontSize: "26px",
            color: "rgba(245,240,232,0.55)",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "36px",
          }}
        >
          Eventos Legendarios en Zacatecas
        </div>

        {/* Tags de servicios */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "880px",
            padding: "0 40px",
          }}
        >
          {[
            "Bodas",
            "XV Años",
            "Graduaciones",
            "Corporativos",
            "DJ · Audio · Shows",
          ].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "9px 22px",
                borderRadius: "999px",
                border: "1px solid rgba(232,25,138,0.35)",
                background: "rgba(232,25,138,0.09)",
                color: "rgba(245,240,232,0.65)",
                fontSize: "17px",
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Línea acento inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "5px",
            background:
              "linear-gradient(90deg, transparent 0%, #E8198A 40%, #FF3DA8 60%, transparent 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
