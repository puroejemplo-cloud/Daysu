import { ImageResponse } from "next/og";

export const size        = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://daysu.vip/logo-daysu.png"
          width={40}
          height={40}
          alt="Daysu.vip"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size }
  );
}
