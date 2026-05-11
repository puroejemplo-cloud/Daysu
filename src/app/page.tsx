import HomeClient from "@/components/home/HomeClient";
import { prisma } from "@/lib/prisma";
import { fetchGoogleReviews } from "@/lib/google-places";
import { extname, basename } from "path";
import { getHomepagePackageIds } from "@/lib/cached-settings";

function toWebpName(name: string): string {
  return basename(name, extname(name))
    .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "") + ".webp";
}

async function loadCarouselImages(): Promise<{ src: string; alt: string }[]> {
  try {
    const { list } = await import("@vercel/blob");
    const [cfgBlobs, procBlobs] = await Promise.all([
      list({ prefix: "galeria/config/carousel.json" }).then(r => r.blobs),
      list({ prefix: "galeria/processed/" }).then(r => r.blobs),
    ]);
    const cfgBlob = cfgBlobs.find(b => b.pathname === "galeria/config/carousel.json");
    if (!cfgBlob) return [];

    const res = await fetch(cfgBlob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const selected: string[] = await res.json();

    const procMap = new Map(
      procBlobs.map(b => [b.pathname.slice("galeria/processed/".length), b.url])
    );

    return selected
      .map(name => {
        const url = procMap.get(toWebpName(name));
        if (!url) return null;
        return {
          src: url,
          alt: basename(name, extname(name))
            .replace(/[-_]/g, " ").replace(/\s+/g, " ").trim()
            .replace(/^\w/, c => c.toUpperCase()),
        };
      })
      .filter((x): x is { src: string; alt: string } => x !== null);
  } catch {
    // Blob suspendido o no disponible — usar URLs de fallback si están configuradas
    const fallback = process.env.CAROUSEL_FALLBACK_URLS;
    if (!fallback) return [];
    return fallback.split(",").map((url, i) => ({
      src: url.trim(),
      alt: `Evento ${i + 1}`,
    }));
  }
}

export default async function HomePage() {
  const carouselImages = await loadCarouselImages();

  type PkgRow = {
    id: number; name: string; sku: string; isRecommended: boolean;
    description: string | null;
    dailyRate: { toString(): string };
    originalPrice: { toString(): string } | null;
    ownerAdmin: { fullName: string } | null;
  };
  let packages:        PkgRow[]                                                         = [];
  let whatsappSetting: { value: string } | null = null;
  let imageRows:       { id: number; imageUrl: string | null; imageGallery: unknown }[] = [];
  let componentLinks:  { parentAssetId: number; childAssetId: number }[]               = [];

  try {
    const homepagePkgIds = await getHomepagePackageIds();

    [packages, whatsappSetting] = await Promise.all([
      prisma.asset.findMany({
        where: {
          isActive: true,
          isRentable: true,
          assetType: "package",
          ...(homepagePkgIds.length > 0 ? { id: { in: homepagePkgIds } } : {}),
        },
        select: {
          id: true, name: true, dailyRate: true, originalPrice: true,
          description: true, sku: true, isRecommended: true,
          ownerAdmin: { select: { fullName: true } },
        },
        orderBy: { dailyRate: "asc" },
      }),
      prisma.systemSetting.findUnique({ where: { key: "whatsapp_number" } }).catch(() => null),
    ]);

    const pkgIds = packages.map((p) => p.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [imageRows, componentLinks] = await Promise.all([
      (prisma.asset.findMany as any)({
        where: { id: { in: pkgIds } },
        select: { id: true, imageUrl: true, imageGallery: true },
      }).catch(() => []),
      prisma.assetComponent.findMany({
        where:  { parentAssetId: { in: pkgIds } },
        select: { parentAssetId: true, childAssetId: true },
      }).catch(() => []),
    ]);
  } catch { /* BD no disponible en build time — la página carga vacía */ }

  const googleReviews = await fetchGoogleReviews();

  const imageMap   = new Map<number, string | null>(imageRows.map((r: any) => [r.id as number, (r.imageUrl as string | null) ?? null]));
  const galleryMap = new Map<number, string[]>(imageRows.map((r: any) => [
    r.id as number,
    Array.isArray(r.imageGallery) ? (r.imageGallery as string[]) : [],
  ]));

  // Componentes ordenados por precio descendente
  const childIds = [...new Set(componentLinks.map((c) => c.childAssetId))];
  const childAssets: { id: number; name: string; dailyRate: { toString(): string } }[] = childIds.length
    ? await prisma.asset.findMany({
        where: { id: { in: childIds } },
        select: { id: true, name: true, dailyRate: true },
      }).catch(() => [])
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
    compMap.set(parentId, items.sort((a, b) => b.price - a.price).map(i => i.name));
  }

  return (
    <HomeClient
      carouselImages={carouselImages}
      whatsappNumber={whatsappSetting?.value ?? "524929496372"}
      googleReviews={googleReviews}
      packages={packages.map((p) => ({
        ...p,
        dailyRate:      p.dailyRate.toString(),
        originalPrice:  p.originalPrice?.toString() ?? null,
        ownerName:      p.ownerAdmin?.fullName ?? null,
        imageUrl:       imageMap.get(p.id) ?? null,
        imageGallery:   galleryMap.get(p.id) ?? [],
        componentNames: compMap.get(p.id) ?? [],
      }))}
    />
  );
}
