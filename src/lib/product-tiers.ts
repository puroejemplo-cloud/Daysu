// ── Tipos ──────────────────────────────────────────────────────────────────────
/** Tier unificado: tanto hourly como capacity usan label + price explícito */
export interface PricingTierItem { label: string; price: number }
export type PricingConfig =
  | { type: "hourly" | "capacity"; tiers: PricingTierItem[] }
  | { type: "per_person" };

/** Devuelve true si el activo usa precio por persona (dailyRate × cantidad de invitados). */
export function isPerPerson(db?: PricingConfig | null): boolean {
  return db?.type === "per_person";
}

// Sin fallbacks hardcodeados — el admin configura los tiers desde el panel
const HOURLY_FALLBACK:   Record<string, PricingTierItem[]> = {};
const CAPACITY_FALLBACK: Record<string, PricingTierItem[]> = {};

// ── Helpers: BD primero, fallback después ──────────────────────────────────────
export function getHourlyTiers(sku: string, db?: PricingConfig | null): PricingTierItem[] | null {
  if (db?.type === "hourly" && db.tiers.length) return db.tiers;
  return Object.hasOwn(HOURLY_FALLBACK, sku) ? HOURLY_FALLBACK[sku] : null;
}

export function getCapacityTiers(sku: string, db?: PricingConfig | null): PricingTierItem[] | null {
  if (db?.type === "capacity" && db.tiers.length) return db.tiers;
  return Object.hasOwn(CAPACITY_FALLBACK, sku) ? CAPACITY_FALLBACK[sku] : null;
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
