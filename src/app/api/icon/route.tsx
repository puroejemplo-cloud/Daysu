import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const size = Math.min(Math.max(Number(searchParams.get("size") ?? "512"), 72), 512);
  const logo = Math.round(size * 0.68);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05051a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: `${-size * 0.25}px`,
            left: `${-size * 0.25}px`,
            width: `${size * 1.5}px`,
            height: `${size * 1.5}px`,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,25,138,0.22) 0%, transparent 65%)",
            display: "flex",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://daysu.vip/logo-daysu.png"
          width={logo}
          height={logo}
          alt="Daysu.vip"
          style={{ objectFit: "contain", position: "relative" }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
