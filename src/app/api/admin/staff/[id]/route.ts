import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

// PUT /api/admin/staff/[id] — editar o dar de baja (isActive=false)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const { id } = await params;
  const staffId = parseInt(id);
  if (isNaN(staffId)) return err("ID inválido");

  const body = await req.json().catch(() => null);
  if (!body) return err("JSON inválido");

  const { fullName, email, phone, isActive } = body;

  const existing = await prisma.staffUser.findUnique({ where: { id: staffId } });
  if (!existing) return err("Colaborador no encontrado", 404);

  if (email && email.trim() !== existing.email) {
    const conflict = await prisma.staffUser.findUnique({ where: { email: email.trim() } });
    if (conflict && conflict.id !== staffId) return err("Ese email ya está en uso", 409);
  }

  const updated = await prisma.staffUser.update({
    where: { id: staffId },
    data: {
      ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
      ...(email    !== undefined ? { email: email.trim().toLowerCase() } : {}),
      ...(phone    !== undefined ? { phone: phone?.trim() || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });
  return ok(updated);
}
