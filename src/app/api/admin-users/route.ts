import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") return err("No autorizado", 403);

  const admins = await prisma.adminUser.findMany({
    select: { id: true, username: true, email: true, fullName: true, suffix: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(admins);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") return err("No autorizado", 403);

  const body = await req.json();
  const { username, email, fullName, suffix, password, role } = body;

  if (!username?.trim() || !email?.trim() || !fullName?.trim() || !suffix?.trim() || !password)
    return err("Todos los campos son requeridos");
  if (suffix.length > 8) return err("El suffix debe tener máximo 8 caracteres");

  const [uExist, sExist] = await Promise.all([
    prisma.adminUser.findUnique({ where: { username } }),
    prisma.adminUser.findUnique({ where: { suffix: suffix.toUpperCase() } }),
  ]);
  if (uExist) return err(`El usuario '${username}' ya existe`, 409);
  if (sExist) return err(`El suffix '${suffix}' ya está en uso`, 409);

  const hash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.create({
    data: {
      username:  username.trim().toLowerCase(),
      email:     email.trim().toLowerCase(),
      fullName:  fullName.trim(),
      suffix:    suffix.trim().toUpperCase(),
      password:  hash,
      role:      role === "superadmin" ? "superadmin" : "admin",
      createdBy: Number(session.user.id),
    },
    select: { id: true, username: true, email: true, fullName: true, suffix: true, role: true },
  });
  return ok(admin, 201);
}
