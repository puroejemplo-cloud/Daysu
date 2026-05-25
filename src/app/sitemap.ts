import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SERVICE_PAGES } from "@/lib/service-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  const now  = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0  },
    { url: `${base}/catalogo`, lastModified: now, changeFrequency: "weekly",  priority: 0.9  },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
  ];

  const serviceUrls: MetadataRoute.Sitemap = SERVICE_PAGES.map((p) => ({
    url:             `${base}/servicios/${p.slug}`,
    lastModified:    now,
    changeFrequency: "monthly" as const,
    priority:        0.85,
  }));

  try {
    const assets = await prisma.asset.findMany({
      where:  { isActive: true, isRentable: true },
      select: { sku: true, updatedAt: true },
    });

    const catalogUrls: MetadataRoute.Sitemap = assets.map((a) => ({
      url:             `${base}/catalogo/${a.sku.toLowerCase()}`,
      lastModified:    a.updatedAt,
      changeFrequency: "weekly" as const,
      priority:        0.8,
    }));

    return [...staticUrls, ...serviceUrls, ...catalogUrls];
  } catch {
    return [...staticUrls, ...serviceUrls];
  }
}
