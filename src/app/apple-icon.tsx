import { ImageResponse } from "next/og";

export const size        = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: "22%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow sutil */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "-40px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,25,138,0.25) 0%, transparent 65%)",
            display: "flex",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://daysu.vip/logo-daysu.png"
          width={128}
          height={128}
          alt="Daysu.vip"
          style={{ objectFit: "contain", position: "relative" }}
        />
      </div>
    ),
    { ...size }
  );
}
