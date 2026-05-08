import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

// GET /api/admin/staff — lista de personal con sus activos asignados
export async function GET() {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const staff = await prisma.staffUser.findMany({
    where: { isActive: true },
    include: {
      assetAssignments: {
        include: {
          asset: { select: { id: true, name: true, sku: true } },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });
  return ok(staff);
}

// POST /api/admin/staff — alta de personal
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("JSON inválido");

  const { fullName, email, phone } = body;
  if (!fullName?.trim()) return err("El nombre es requerido");
  if (!email?.trim())    return err("El email es requerido");

  const existing = await prisma.staffUser.findUnique({ where: { email: email.trim() } });
  if (existing) {
    if (!existing.isActive) {
      const reactivated = await prisma.staffUser.update({
        where: { id: existing.id },
        data: { isActive: true, fullName: fullName.trim(), phone: phone?.trim() || null },
      });
      return ok(reactivated, 200);
    }
    return err("Ya existe un colaborador con ese email", 409);
  }

  const staff = await prisma.staffUser.create({
    data: {
      fullName: fullName.trim(),
      email:    email.trim().toLowerCase(),
      phone:    phone?.trim() || null,
    },
  });
  return ok(staff, 201);
}
