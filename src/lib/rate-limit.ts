import { NextRequest } from "next/server";
import { err } from "./api";

interface Window { count: number; resetAt: number }

const store = new Map<string, Window>();

// Limpia entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Aplica rate limiting por IP.
 * Devuelve una Response de error si se excede el límite, o null si pasa.
 *
 * @param req     - NextRequest entrante
 * @param limit   - máximo de peticiones en la ventana
 * @param windowMs - tamaño de la ventana en ms (default 60 000 = 1 min)
 */
export function rateLimit(
  req: NextRequest,
  limit: number,
  windowMs = 60_000
): Response | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  const win = store.get(key);

  if (!win || win.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  win.count += 1;

  if (win.count > limit) {
    const retryAfter = Math.ceil((win.resetAt - now) / 1000);
    const res = err("Demasiadas solicitudes. Intenta de nuevo en unos momentos.", 429);
    res.headers.set("Retry-After", String(retryAfter));
    return res;
  }

  return null;
}
