import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  getPricingTiers,
  getHourlyTiers,
  getCapacityTiers,
  getTierLabel,
  type PricingTierItem,
} from "@/lib/product-tiers";

type TieredConfig = { type: "hourly" | "capacity"; tiers: PricingTierItem[] };

// ── Arbitrarios ──────────────────────────────────────────────────────────────

const tierItem = fc.record<PricingTierItem>({
  label: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 0, max: 1_000_000 }),
});

const nonEmptyTiers = fc.array(tierItem, { minLength: 1, maxLength: 20 });

const hourlyConfig   = nonEmptyTiers.map<TieredConfig>((tiers) => ({ type: "hourly",   tiers }));
const capacityConfig = nonEmptyTiers.map<TieredConfig>((tiers) => ({ type: "capacity", tiers }));

const sku = fc.string({ minLength: 1, maxLength: 20 });
const assetName = fc.string({ minLength: 1, maxLength: 100 });

// ── getPricingTiers ──────────────────────────────────────────────────────────

describe("getPricingTiers", () => {
  it("devuelve config hourly exacta cuando db tiene tiers hourly", () => {
    fc.assert(
      fc.property(sku, hourlyConfig, (s, db) => {
        const result = getPricingTiers(s, db);
        expect(result).toEqual(db);
      })
    );
  });

  it("devuelve config capacity exacta cuando db tiene tiers capacity", () => {
    fc.assert(
      fc.property(sku, capacityConfig, (s, db) => {
        const result = getPricingTiers(s, db);
        expect(result).toEqual(db);
      })
    );
  });

  it("devuelve null cuando db es null (sin fallbacks configurados)", () => {
    fc.assert(
      fc.property(sku, (s) => {
        expect(getPricingTiers(s, null)).toBeNull();
        expect(getPricingTiers(s, undefined)).toBeNull();
      })
    );
  });

  it("devuelve null cuando db tiene tiers vacíos", () => {
    fc.assert(
      fc.property(
        sku,
        fc.constantFrom<TieredConfig>(
          { type: "hourly",    tiers: [] },
          { type: "capacity",  tiers: [] }
        ),
        (s, db) => {
          expect(getPricingTiers(s, db)).toBeNull();
        }
      )
    );
  });

  it("tipo del resultado coincide con el tipo de la config", () => {
    fc.assert(
      fc.property(sku, fc.oneof(hourlyConfig, capacityConfig), (s, db) => {
        const result = getPricingTiers(s, db);
        expect(result?.type).toBe(db.type);
      })
    );
  });
});

// ── getHourlyTiers / getCapacityTiers ────────────────────────────────────────

describe("getHourlyTiers", () => {
  it("devuelve los tiers cuando db.type === 'hourly' y no está vacío", () => {
    fc.assert(
      fc.property(sku, hourlyConfig, (s, db) => {
        expect(getHourlyTiers(s, db)).toEqual(db.tiers);
      })
    );
  });

  it("devuelve null para config capacity", () => {
    fc.assert(
      fc.property(sku, capacityConfig, (s, db) => {
        expect(getHourlyTiers(s, db)).toBeNull();
      })
    );
  });
});

describe("getCapacityTiers", () => {
  it("devuelve los tiers cuando db.type === 'capacity' y no está vacío", () => {
    fc.assert(
      fc.property(sku, capacityConfig, (s, db) => {
        expect(getCapacityTiers(s, db)).toEqual(db.tiers);
      })
    );
  });

  it("devuelve null para config hourly", () => {
    fc.assert(
      fc.property(sku, hourlyConfig, (s, db) => {
        expect(getCapacityTiers(s, db)).toBeNull();
      })
    );
  });
});

// ── getTierLabel ─────────────────────────────────────────────────────────────

describe("getTierLabel", () => {
  it("incluye el tier label cuando el precio coincide exactamente en config hourly", () => {
    fc.assert(
      fc.property(assetName, sku, hourlyConfig, (name, s, db) => {
        const tier = db.tiers[0];
        const label = getTierLabel(name, s, tier.price, undefined, db);
        expect(label).toContain(name);
        expect(label).toContain(tier.label);
      })
    );
  });

  it("incluye el tier label cuando el precio coincide exactamente en config capacity", () => {
    fc.assert(
      fc.property(assetName, sku, capacityConfig, (name, s, db) => {
        const tier = db.tiers[0];
        const label = getTierLabel(name, s, tier.price, undefined, db);
        expect(label).toContain(name);
        expect(label).toContain(tier.label);
      })
    );
  });

  it("devuelve assetName sin modificar cuando overridePrice es undefined", () => {
    fc.assert(
      fc.property(assetName, sku, fc.oneof(hourlyConfig, capacityConfig), (name, s, db) => {
        expect(getTierLabel(name, s, undefined, undefined, db)).toBe(name);
      })
    );
  });

  it("devuelve assetName cuando precio no coincide con ningún tier", () => {
    // Precio negativo nunca está en los tiers (tiers tienen price >= 0)
    fc.assert(
      fc.property(assetName, sku, fc.oneof(hourlyConfig, capacityConfig), (name, s, db) => {
        expect(getTierLabel(name, s, -1, undefined, db)).toBe(name);
      })
    );
  });
});
