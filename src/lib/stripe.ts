import Stripe from "stripe";

function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no está configurada");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

let _stripe: Stripe | undefined;

// Proxy lazy — Stripe solo se inicializa en el primer uso real (runtime), no en build time.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    if (!_stripe) _stripe = createStripeClient();
    const value = (_stripe as any)[prop];
    return typeof value === "function" ? value.bind(_stripe) : value;
  },
});
