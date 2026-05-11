import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id");
  const onlyRentable = searchParams.get("rentable") === "true";

  const assets = await prisma.asset.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(onlyRentable ? { isRentable: true } : {}),
    },
    include: {
      category: true,
      components: true,
      staffAssignments: { include: { staff: true } },
    },
    orderBy: { name: "asc" },
  });
  return ok(assets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const body = await req.json();
  const { categoryId, name, sku, description, totalUnits, dailyRate, isRentable } = body;

  if (!name?.trim()) return err("El nombre del activo es requerido");
  if (!sku?.trim()) return err("El SKU es requerido");
  if (!categoryId) return err("La categoría es requerida");
  if (!totalUnits || totalUnits < 1) return err("Las unidades totales deben ser mayor a 0");
  if (dailyRate == null || dailyRate < 0) return err("La tarifa diaria es requerida");

  const existing = await prisma.asset.findUnique({ where: { sku: sku.trim() } });
  if (existing) return err(`El SKU '${sku}' ya existe`, 409);

  const asset = await prisma.asset.create({
    data: {
      categoryId: Number(categoryId),
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      description: description?.trim() ?? null,
      totalUnits: Number(totalUnits),
      dailyRate: Number(dailyRate),
      isRentable: isRentable ?? true,
    },
    include: { category: true },
  });
  return ok(asset, 201);
}
