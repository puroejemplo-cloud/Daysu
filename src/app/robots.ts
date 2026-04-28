import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? "https://auraproduccionesvip.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalogo", "/reservar"],
        disallow: ["/admin/", "/superadmin/", "/api/", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
