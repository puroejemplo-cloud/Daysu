import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PackageDetail from "@/components/catalog/PackageDetail";
import type { PricingConfig } from "@/lib/product-tiers";

type Props = { params: Promise<{ id: string }> };

// El parámetro `id` contiene el SKU en minúsculas (ej: "pkg-mediano").
// Se convierte a mayúsculas para buscar en BD. Si no se encuentra por SKU,
// intenta búsqueda por ID numérico para mantener compatibilidad con links viejos.
async function findAsset(slug: string) {
  // Primero: buscar por SKU (caso normal — slug = SKU en minúsculas)
  const bySku = await prisma.asset.findFirst({
    where: { sku: slug.toUpperCase(), isActive: true, isRentable: true },
    include: {
      category:   true,
      ownerAdmin: { select: { fullName: true } },
      components: {
        include: { childAsset: { select: { id: true, name: true, dailyRate: true } } },
      },
    },
  }).catch(() => null);
  if (bySku) return bySku;

  // Fallback: buscar por ID numérico (links generados antes del cambio)
  const numId = Number(slug);
  if (isNaN(numId)) return null;
  return prisma.asset.findUnique({
    where: { id: numId, isActive: true, isRentable: true },
    include: {
      category:   true,
      ownerAdmin: { select: { fullName: true } },
      components: {
        include: { childAsset: { select: { id: true, name: true, dailyRate: true } } },
      },
    },
  }).catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;
  const asset = await prisma.asset.findFirst({
    where: { sku: slug.toUpperCase(), isActive: true },
    select: { name: true, description: true, imageUrl: true, imageGallery: true },
  }).catch(() => null);

  if (!asset) return { title: "Paquete no encontrado — Daysu.vip" };

  const gallery   = Array.isArray(asset.imageGallery) ? (asset.imageGallery as string[]) : [];
  const ogImage   = gallery[0] ?? asset.imageUrl ?? undefined;
  const firstLine = (asset.description ?? "").split("\n")[0]?.trim();

  return {
    title: `${asset.name} — Daysu.vip`,
    description: firstLine || `Conoce los detalles de ${asset.name} y reserva tu fecha.`,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  };
}

export const dynamic = "force-dynamic";

export default async function PackageDetailPage({ params }: Props) {
  const { id: slug } = await params;
  const asset = await findAsset(slug);
  if (!asset) notFound();

  const componentNames = [...asset.components]
    .sort((a, b) => Number(b.childAsset.dailyRate) - Number(a.childAsset.dailyRate))
    .map((c) => c.childAsset.name);

  const gallery = Array.isArray(asset.imageGallery) ? (asset.imageGallery as string[]) : [];

  return (
    <PackageDetail
      asset={{
        id:            asset.id,
        name:          asset.name,
        sku:           asset.sku,
        dailyRate:     asset.dailyRate.toString(),
        originalPrice: asset.originalPrice?.toString() ?? null,
        description:   asset.description,
        categoryName:  asset.category.name,
        ownerName:     asset.ownerAdmin?.fullName ?? null,
        imageUrl:      asset.imageUrl,
        imageGallery:  gallery,
        pricingTiers:  (asset.pricingTiers ?? null) as PricingConfig | null,
        maxGuests:     asset.maxGuests,
        isRecommended: asset.isRecommended,
        promoType:     asset.promoType,
        componentNames,
      }}
    />
  );
}
