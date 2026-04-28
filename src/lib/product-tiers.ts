// ── Tipos ──────────────────────────────────────────────────────────────────────
/** Tier unificado: tanto hourly como capacity usan label + price explícito */
export interface PricingTierItem { label: string; price: number }
export type PricingConfig = { type: "hourly" | "capacity"; tiers: PricingTierItem[] };

// ── Fallbacks hardcodeados (cuando la BD no tiene tiers configurados) ──────────
const HOURLY_FALLBACK: Record<string, PricingTierItem[]> = {
  "CAB-FOTO-OFERTA": [
    { label: "1 hora",  price: 2_000 },
    { label: "2 horas", price: 3_000 },
    { label: "3 horas", price: 3_500 },
  ],
};

const CAPACITY_FALLBACK: Record<string, PricingTierItem[]> = {
  "DAY-MARUCHAN": [
    { label: "50 personas",  price: 0 },   // admin debe configurar precios reales
    { label: "100 personas", price: 0 },
    { label: "150 personas", price: 0 },
    { label: "200 personas", price: 0 },
  ],
};

// ── Helpers: BD primero, fallback después ──────────────────────────────────────
export function getHourlyTiers(sku: string, db?: PricingConfig | null): PricingTierItem[] | null {
  if (db?.type === "hourly" && db.tiers.length) return db.tiers;
  return HOURLY_FALLBACK[sku] ?? null;
}

export function getCapacityTiers(sku: string, db?: PricingConfig | null): PricingTierItem[] | null {
  if (db?.type === "capacity" && db.tiers.length) return db.tiers;
  return CAPACITY_FALLBACK[sku] ?? null;
}

export function getPricingTiers(sku: string, db?: PricingConfig | null): PricingConfig | null {
  const h = getHourlyTiers(sku, db);
  if (h) return { type: "hourly", tiers: h };
  const c = getCapacityTiers(sku, db);
  if (c) return { type: "capacity", tiers: c };
  return null;
}

/** Genera la etiqueta descriptiva para el desglose del resumen */
export function getTierLabel(
  assetName: string,
  sku: string,
  overridePrice?: number,
  _qty?: number,
  db?: PricingConfig | null,
): string {
  if (overridePrice !== undefined) {
    const h = getHourlyTiers(sku, db);
    const tierH = h?.find((t) => t.price === overridePrice);
    if (tierH) return `${assetName} (${tierH.label})`;

    const c = getCapacityTiers(sku, db);
    const tierC = c?.find((t) => t.price === overridePrice);
    if (tierC) return `${assetName} — ${tierC.label}`;
  }
  return assetName;
}

// Exports de compatibilidad
export const HOURLY_TIERS   = HOURLY_FALLBACK;
export const CAPACITY_TIERS = CAPACITY_FALLBACK;

// Tipos legacy (para código que los importaba antes)
export type HourlyTierDef   = PricingTierItem;
export type CapacityTierDef = PricingTierItem;
