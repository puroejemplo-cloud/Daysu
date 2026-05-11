import { Suspense } from "react";
import type { Metadata } from "next";
import CatalogClient from "@/components/catalog/CatalogClient";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { PricingConfig } from "@/lib/product-tiers";

export const metadata: Metadata = {
  title: "Catálogo de paquetes y servicios",
  description: "Explora todos los paquetes de DJ, audio, iluminación, shows y entretenimiento para tu evento en Zacatecas.",
  openGraph: {
    title: "Catálogo — Daysu.vip",
    description: "Paquetes de DJ, audio, iluminación y entretenimiento para bodas, XV Años y eventos en Zacatecas.",
  },
};

type CatalogAsset = {
  id: number; name: string; sku: string;
  dailyRate: string; originalPrice: string | null;
  categoryId: number; description: string | null;
  ownerName: string | null; categoryName: string | null;
  pricingTiers: PricingConfig | null;
  imageUrl: string | null; imageGallery: string[];
  componentNames: string[];
};

type CatalogData = {
  categories: { id: number; name: string; _count?: { assets: number } }[];
  assets: CatalogAsset[];
};

const getCatalogData = unstable_cache(
  async (): Promise<CatalogData> => {

  const [allCategories, assets, componentLinks] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.asset.findMany({
      where: { isActive: true, isRentable: true, assetType: { in: ["package", "product"] } },
      select: {
        id: true, name: true, sku: true, dailyRate: true, originalPrice: true,
        categoryId: true, description: true,
        ownerAdmin: { select: { fullName: true } },
        category: { select: { name: true } },
      },
      orderBy: { dailyRate: "asc" },
    }),
    prisma.assetComponent.findMany({
      select: { parentAssetId: true, childAssetId: true },
    }),
  ]);

  // Componentes BOM con precio para ordenar descendente
  const childIds    = [...new Set(componentLinks.map((c) => c.childAssetId))];
  const childAssets = childIds.length
    ? await prisma.asset.findMany({
        where: { id: { in: childIds } },
        select: { id: true, name: true, dailyRate: true },
      })
    : [];
  const childAssetMap = new Map(childAssets.map((a) => [a.id, { name: a.name, price: Number(a.dailyRate) }]));

  const compWithPrice = new Map<number, { name: string; price: number }[]>();
  for (const link of componentLinks) {
    const asset = childAssetMap.get(link.childAssetId);
    if (!asset) continue;
    if (!compWithPrice.has(link.parentAssetId)) compWithPrice.set(link.parentAssetId, []);
    compWithPrice.get(link.parentAssetId)!.push(asset);
  }
  const compMap = new Map<number, string[]>();
  for (const [parentId, items] of compWithPrice) {
    compMap.set(parentId, items.sort((a, b) => b.price - a.price).map((i) => i.name));
  }

  // Campos extendidos (imageUrl, pricingTiers, imageGallery)
  const pricingMap      = new Map<number, PricingConfig | null>();
  const imageUrlMap     = new Map<number, string | null>();
  const imageGalleryMap = new Map<number, string[]>();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extras = await (prisma.asset.findMany as any)({
      where: { id: { in: assets.map((a) => a.id) } },
      select: { id: true, pricingTiers: true, imageUrl: true, imageGallery: true },
    }) as { id: number; pricingTiers: unknown; imageUrl: string | null; imageGallery: unknown }[];
    for (const a of extras) {
      pricingMap.set(a.id, (a.pricingTiers ?? null) as PricingConfig | null);
      imageUrlMap.set(a.id, a.imageUrl ?? null);
      const gallery = Array.isArray(a.imageGallery) ? (a.imageGallery as string[]) : [];
      if (gallery.length) imageGalleryMap.set(a.id, gallery);
    }
  } catch { /* columnas aún no disponibles en cliente cacheado */ }

  const activeCatIds = new Set(assets.map((a) => a.categoryId));

  return {
    categories: allCategories.filter((c) => activeCatIds.has(c.id)),
    assets: assets.map((a) => ({
      id:             a.id,
      name:           a.name,
      sku:            a.sku,
      dailyRate:      a.dailyRate.toString(),
      originalPrice:  a.originalPrice?.toString() ?? null,
      categoryId:     a.categoryId,
      description:    a.description,
      ownerName:      a.ownerAdmin?.fullName ?? null,
      categoryName:   (a as typeof a & { category: { name: string } }).category?.name ?? null,
      pricingTiers:   pricingMap.get(a.id) ?? null,
      imageUrl:       imageUrlMap.get(a.id) ?? null,
      imageGallery:   imageGalleryMap.get(a.id) ?? [],
      componentNames: compMap.get(a.id) ?? [],
    })),
  };
  },
  ["catalog-data"],
  { revalidate: 300, tags: ["catalog"] }
);

export default async function CatalogoPage() {
  const { categories, assets } = await getCatalogData();

  return (
    <Suspense fallback={<div style={{ background: "#05051a", minHeight: "100vh" }} />}>
      <CatalogClient categories={categories} assets={assets} />
    </Suspense>
  );
}
