import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// GET /api/upsell?assets=1,2,3
// Devuelve sugerencias de upsell basadas en los activos seleccionados.
// Si el activo sugerido ya está en la lista, se omite.
export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("assets");
  if (!raw) return err("El parámetro 'assets' es requerido");

  const assetIds = raw.split(",").map(Number).filter(Boolean);
  if (assetIds.length === 0) return err("IDs de activos inválidos");

  const rules = await prisma.upsellRule.findMany({
    where: {
      sourceAssetId: { in: assetIds },
      isActive: true,
      // no sugerir algo que ya está seleccionado
      suggestedAssetId: { notIn: assetIds },
    },
    include: {
      sourceAsset:    { select: { id: true, name: true } },
      suggestedAsset: { select: { id: true, name: true, dailyRate: true } },
    },
    orderBy: { discountPercent: "desc" },
  });

  // Deduplicar: si el mismo activo sugerido aparece por varias fuentes, tomar el mayor descuento
  const seen = new Map<number, (typeof rules)[0]>();
  for (const rule of rules) {
    const prev = seen.get(rule.suggestedAssetId);
    if (!prev || Number(rule.discountPercent) > Number(prev.discountPercent)) {
      seen.set(rule.suggestedAssetId, rule);
    }
  }

  const suggestions = [...seen.values()].map((r) => ({
    ruleId:           r.id,
    suggestedAssetId: r.suggestedAssetId,
    suggestedName:    r.suggestedAsset.name,
    originalPrice:    Number(r.suggestedAsset.dailyRate),
    discountPercent:  Number(r.discountPercent),
    discountedPrice:  Number(r.suggestedAsset.dailyRate) * (1 - Number(r.discountPercent) / 100),
    label:            r.label ?? `¡Combínalo con ${r.suggestedAsset.name} y ahorra ${r.discountPercent}%!`,
    triggeredBy:      r.sourceAsset.name,
  }));

  return ok(suggestions);
}
