import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") return err("No autorizado", 403);

  const { id } = await params;
  const body = await req.json();
  const { isActive, password, fullName } = body;

  const admin = await prisma.adminUser.findUnique({ where: { id: Number(id) } });
  if (!admin) return err("Admin no encontrado", 404);

  const updated = await prisma.adminUser.update({
    where: { id: Number(id) },
    data: {
      ...(isActive  !== undefined && { isActive }),
      ...(fullName  !== undefined && { fullName: fullName.trim() }),
      ...(password  !== undefined && { password: await bcrypt.hash(password, 12) }),
    },
    select: { id: true, username: true, fullName: true, suffix: true, isActive: true, role: true },
  });
  return ok(updated);
}
