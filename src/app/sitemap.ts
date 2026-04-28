import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXTAUTH_URL ?? "https://auraproduccionesvip.com";
  const now  = new Date();

  return [
    { url: `${base}/`,        lastModified: now, changeFrequency: "weekly",  priority: 1.0  },
    { url: `${base}/catalogo`, lastModified: now, changeFrequency: "weekly",  priority: 0.9  },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
  ];
}
