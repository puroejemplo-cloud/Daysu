import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
  const categories = await prisma.assetCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { assets: true } } },
  });
  return ok(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description } = body;

  if (!name?.trim()) return err("El nombre de la categoría es requerido");

  const category = await prisma.assetCategory.create({
    data: { name: name.trim(), description: description?.trim() ?? null },
  });
  return ok(category, 201);
}
