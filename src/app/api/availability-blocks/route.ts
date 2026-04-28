import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { BlockType } from "@/generated/prisma";

const VALID_TYPES: BlockType[] = ["maintenance", "logistics", "transit", "other"];

export async function GET(req: NextRequest) {
  const assetId = new URL(req.url).searchParams.get("asset_id");
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      ...(assetId ? { assetId: Number(assetId) } : {}),
      endAt: { gt: new Date() }, // solo bloqueos vigentes o futuros
    },
    include: { asset: { select: { id: true, name: true } } },
    orderBy: { startAt: "asc" },
  });
  return ok(blocks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { assetId, blockType, startAt, endAt, notes } = body;

  if (!blockType || !VALID_TYPES.includes(blockType)) {
    return err(`blockType debe ser uno de: ${VALID_TYPES.join(", ")}`);
  }
  if (!startAt || !endAt) return err("startAt y endAt son requeridos");

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return err("Fechas inválidas");
  if (start >= end) return err("startAt debe ser anterior a endAt");

  const block = await prisma.availabilityBlock.create({
    data: {
      assetId: assetId ? Number(assetId) : null,
      blockType,
      startAt: start,
      endAt: end,
      notes: notes?.trim() ?? null,
    },
  });
  return ok(block, 201);
}
