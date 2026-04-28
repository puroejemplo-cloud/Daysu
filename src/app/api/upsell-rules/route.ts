import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
  const rules = await prisma.upsellRule.findMany({
    include: {
      sourceAsset:    { select: { id: true, name: true } },
      suggestedAsset: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(rules);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sourceAssetId, suggestedAssetId, discountPercent, label } = body;

  if (!sourceAssetId || !suggestedAssetId) return err("sourceAssetId y suggestedAssetId son requeridos");
  if (sourceAssetId === suggestedAssetId) return err("Los activos origen y sugerido deben ser distintos");
  if (discountPercent == null || discountPercent < 0 || discountPercent > 100) {
    return err("discountPercent debe ser un número entre 0 y 100");
  }

  const [source, suggested] = await Promise.all([
    prisma.asset.findUnique({ where: { id: Number(sourceAssetId) } }),
    prisma.asset.findUnique({ where: { id: Number(suggestedAssetId) } }),
  ]);
  if (!source) return err("Activo origen no encontrado", 404);
  if (!suggested) return err("Activo sugerido no encontrado", 404);

  const rule = await prisma.upsellRule.create({
    data: {
      sourceAssetId:    Number(sourceAssetId),
      suggestedAssetId: Number(suggestedAssetId),
      discountPercent:  Number(discountPercent),
      label:            label?.trim() ?? null,
    },
    include: {
      sourceAsset:    { select: { id: true, name: true } },
      suggestedAsset: { select: { id: true, name: true } },
    },
  });
  return ok(rule, 201);
}
