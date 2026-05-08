import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PackageDetail from "@/components/catalog/PackageDetail";
import type { PricingConfig } from "@/lib/product-tiers";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id: Number(id), isActive: true },
    select: { name: true, description: true, imageUrl: true, imageGallery: true },
  }).catch(() => null);

  if (!asset) return { title: "Paquete no encontrado — Daysu.vip" };

  const gallery = Array.isArray(asset.imageGallery) ? (asset.imageGallery as string[]) : [];
  const ogImage = gallery[0] ?? asset.imageUrl ?? undefined;
  const firstLine = (asset.description ?? "").split("\n")[0]?.trim();

  return {
    title: `${asset.name} — Daysu.vip`,
    description: firstLine || `Conoce los detalles de ${asset.name} y reserva tu fecha.`,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  };
}

export const dynamic = "force-dynamic";

export default async function PackageDetailPage({ params }: Props) {
  const { id } = await params;
  const assetId = Number(id);
  if (isNaN(assetId)) notFound();

  const asset = await prisma.asset.findUnique({
    where: { id: assetId, isActive: true, isRentable: true },
    include: {
      category:   true,
      ownerAdmin: { select: { fullName: true } },
      components: {
        include: {
          childAsset: { select: { id: true, name: true, dailyRate: true } },
        },
      },
    },
  }).catch(() => null);

  if (!asset) notFound();

  const componentNames = [...asset.components]
    .sort((a, b) => Number(b.childAsset.dailyRate) - Number(a.childAsset.dailyRate))
    .map((c) => c.childAsset.name);

  const gallery = Array.isArray(asset.imageGallery) ? (asset.imageGallery as string[]) : [];

  return (
    <PackageDetail
      asset={{
        id:           asset.id,
        name:         asset.name,
        sku:          asset.sku,
        dailyRate:    asset.dailyRate.toString(),
        originalPrice: asset.originalPrice?.toString() ?? null,
        description:  asset.description,
        categoryName: asset.category.name,
        ownerName:    asset.ownerAdmin?.fullName ?? null,
        imageUrl:     asset.imageUrl,
        imageGallery: gallery,
        pricingTiers: (asset.pricingTiers ?? null) as PricingConfig | null,
        maxGuests:    asset.maxGuests,
        isRecommended: asset.isRecommended,
        promoType:    asset.promoType,
        componentNames,
      }}
    />
  );
}
