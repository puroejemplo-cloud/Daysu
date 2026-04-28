import { NextRequest } from "next/server";
import { getAvailability } from "@/lib/availability";
import { ok, err } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/availability?start=ISO&end=ISO&asset_id=X(opcional)
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 60); // 60 consultas/min por IP
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const assetId = searchParams.get("asset_id");

  if (!start || !end) return err("Los parámetros 'start' y 'end' son requeridos (ISO 8601)");

  const startAt = new Date(start);
  const endAt = new Date(end);

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) return err("Fechas inválidas");
  if (startAt >= endAt) return err("'start' debe ser anterior a 'end'");

  const availability = await getAvailability(startAt, endAt, assetId ? Number(assetId) : undefined);
  return ok(availability);
}
