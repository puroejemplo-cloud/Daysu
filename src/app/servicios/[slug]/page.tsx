import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { SERVICE_PAGES, type ServiceDbFilter } from "@/lib/service-pages";
import { getWhatsAppSettings } from "@/lib/cached-settings";
import ServicePage from "@/components/servicios/ServicePage";
import type { ServicePackage } from "@/components/servicios/ServicePage";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return SERVICE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = SERVICE_PAGES.find((p) => p.slug === slug);
  if (!config) return {};
  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      url: `${BASE_URL}/servicios/${slug}`,
      type: "website",
    },
  };
}

/** `isFallback: true` significa que el servicio de la landing no tiene activos
 *  propios en BD y se están mostrando los paquetes generales. ServicePage usa
 *  esta bandera para presentarlos honestamente como "paquetes donde puedes
 *  agregarlo" en lugar de fingir que son paquetes del servicio. */
async function getPackages(filter: ServiceDbFilter): Promise<{ packages: ServicePackage[]; isFallback: boolean }> {
  const baseWhere = { isActive: true, isRentable: true, assetType: "package" as const };

  try {
    let where: Prisma.AssetWhereInput;

    if (filter.type === "packages_all") {
      where = baseWhere;
    } else if (filter.type === "category") {
      where = { ...baseWhere, category: { name: { in: filter.categoryNames } } };
    } else {
      where = { ...baseWhere, name: { contains: filter.keyword, mode: "insensitive" as const } };
    }

    const assets = await prisma.asset.findMany({
      where,
      select: {
        id: true, name: true, sku: true, dailyRate: true,
        description: true, imageUrl: true,
        components: {
          include: { childAsset: { select: { name: true, dailyRate: true } } },
        },
      },
      orderBy: [{ isRecommended: "desc" }, { dailyRate: "asc" }],
      take: 6,
    });

    if (assets.length === 0 && filter.type !== "packages_all") {
      const general = await getPackages({ type: "packages_all" });
      return { packages: general.packages, isFallback: true };
    }

    return {
      isFallback: false,
      packages: assets.map((a) => ({
        id:             a.id,
        name:           a.name,
        sku:            a.sku,
        dailyRate:      a.dailyRate.toString(),
        description:    a.description,
        imageUrl:       a.imageUrl,
        componentNames: [...a.components]
          .sort((x, y) => Number(y.childAsset.dailyRate) - Number(x.childAsset.dailyRate))
          .map((c) => c.childAsset.name),
      })),
    };
  } catch {
    return { packages: [], isFallback: false };
  }
}

export default async function ServiceLandingPage({ params }: Props) {
  const { slug } = await params;
  const config = SERVICE_PAGES.find((p) => p.slug === slug);
  if (!config) notFound();

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";

  const [{ packages, isFallback }, { number: waNumber }] = await Promise.all([
    getPackages(config.dbFilter),
    getWhatsAppSettings(),
  ]);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": config.h1,
    "description": config.jsonLdDescription,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Daysu.vip — Aura Producciones",
      "url": "https://daysu.vip",
    },
    "areaServed": {
      "@type": "City",
      "name": "Zacatecas",
    },
    "url": `${BASE_URL}/servicios/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <ServicePage
        config={config}
        packages={packages}
        isFallback={isFallback}
        waNumber={waNumber ?? "524929496372"}
      />
    </>
  );
}
