import HomeClient from "@/components/home/HomeClient";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // recalcula cada hora, no en cada visita

export default async function HomePage() {
  const packages = await prisma.asset.findMany({
    where: {
      isActive: true, isRentable: true,
      OR: [
        { sku: { startsWith: "PKG-" } },
        { sku: { startsWith: "CAB-" } },
        { sku: { startsWith: "DAY-DJ-AUDIO-" } },
      ],
    },
    select: {
      id: true, name: true, dailyRate: true, originalPrice: true,
      description: true, sku: true, ownerSuffix: true,
      ownerAdmin: { select: { fullName: true } },
    },
    orderBy: { dailyRate: "asc" },
  });

  const pkgIds = packages.map((p) => p.id);

  // Campos nuevos en queries separadas para evitar errores de cliente desactualizado
  const [imageRows, componentLinks] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const childIds    = [...new Set(componentLinks.map((c) => c.childAssetId))];
  const childAssets = childIds.length
    ? await prisma.asset.findMany({ where: { id: { in: childIds } }, select: { id: true, name: true } })
    : [];
  const childNameMap = new Map(childAssets.map((a) => [a.id, a.name]));
  const compMap      = new Map<number, string[]>();
  for (const link of componentLinks) {
    const name = childNameMap.get(link.childAssetId);
    if (!name) continue;
    if (!compMap.has(link.parentAssetId)) compMap.set(link.parentAssetId, []);
    compMap.get(link.parentAssetId)!.push(name);
  }

  return (
    <HomeClient
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
