import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite Server Actions desde la IP de red local (acceso desde teléfono)
  allowedDevOrigins: ["192.168.100.98"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
