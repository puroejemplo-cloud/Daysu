import HomeClient from "@/components/home/HomeClient";
import { prisma } from "@/lib/prisma";
import { extname, basename } from "path";

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
  } catch { return []; }
}

export const revalidate = 60;

export default async function HomePage() {
  const carouselImages = await loadCarouselImages();

  // Leer homepage_packages para filtrar paquetes del index
  const homepageSetting = await prisma.systemSetting.findUnique({ where: { key: "homepage_packages" } }).catch(() => null);
  let homepagePkgIds: number[] = [];
  try {
    if (homepageSetting?.value) homepagePkgIds = JSON.parse(homepageSetting.value);
  } catch { /* muestra todos */ }

  const packages = await prisma.asset.findMany({
    where: {
      isActive: true,
      isRentable: true,
      assetType: "package",
      ...(homepagePkgIds.length > 0 ? { id: { in: homepagePkgIds } } : {}),
    },
    select: {
      id: true, name: true, dailyRate: true, originalPrice: true,
      description: true, sku: true, ownerSuffix: true,
      ownerAdmin: { select: { fullName: true } },
    },
    orderBy: { dailyRate: "asc" },
  });

  const pkgIds = packages.map((p) => p.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [imageRows, componentLinks] = await Promise.all([
    (prisma.asset.findMany as any)({
      where: { id: { in: pkgIds } },
      select: { id: true, imageUrl: true, imageGallery: true },
    }).catch(() => [] as { id: number; imageUrl: string | null; imageGallery: unknown }[]),
    prisma.assetComponent.findMany({
      where:  { parentAssetId: { in: pkgIds } },
      select: { parentAssetId: true, childAssetId: true },
    }).catch(() => [] as { parentAssetId: number; childAssetId: number }[]),
  ]);

  const imageMap   = new Map<number, string | null>(imageRows.map((r: any) => [r.id as number, (r.imageUrl as string | null) ?? null]));
  const galleryMap = new Map<number, string[]>(imageRows.map((r: any) => [
    r.id as number,
    Array.isArray(r.imageGallery) ? (r.imageGallery as string[]) : [],
  ]));

  // Componentes ordenados por precio descendente
  const childIds = [...new Set(componentLinks.map((c) => c.childAssetId))];
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
    compMap.set(parentId, items.sort((a, b) => b.price - a.price).map(i => i.name));
  }

  return (
    <HomeClient
      carouselImages={carouselImages}
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
