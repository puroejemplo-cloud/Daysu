import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { getAdminScope, clientOwnerWhere, bookingOwnerWhere } from "@/lib/adminScope";

// GET /api/clients?q=búsqueda
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);
  const scope = getAdminScope(session);

  const q = new URL(req.url).searchParams.get("q")?.trim();

  const searchWhere = q ? {
    OR: [
      { fullName: { contains: q, mode: "insensitive" as const } },
      { email:    { contains: q, mode: "insensitive" as const } },
      { phone:    { contains: q, mode: "insensitive" as const } },
      { company:  { contains: q, mode: "insensitive" as const } },
    ],
  } : {};

  const clients = await prisma.client.findMany({
    where: { ...searchWhere, ...clientOwnerWhere(scope) },
    include: {
      _count: { select: { bookings: { where: bookingOwnerWhere(scope) } } },
      specialDates: { orderBy: [{ month: "asc" }, { day: "asc" }] },
      bookings: {
        where:   { status: { in: ["confirmed", "completed"] }, ...bookingOwnerWhere(scope) },
        orderBy: { createdAt: "desc" },
        take:    1,
        select:  { eventName: true, setupAt: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(clients);
}

// POST /api/clients — alta manual desde el CRM
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autenticado", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("JSON inválido");

  const { fullName, email, phone, company, taxId, crmNotes, preferencias, referredBy } = body;
  if (!fullName?.trim()) return err("El nombre es requerido");
  if (!email?.trim())    return err("El email es requerido");

  const existing = await prisma.client.findUnique({ where: { email: email.trim() } });
  if (existing) return err("Ya existe un cliente con ese email", 409);

  const client = await prisma.client.create({
    data: {
      fullName:    fullName.trim(),
      email:       email.trim().toLowerCase(),
      phone:       phone?.trim()       || null,
      company:     company?.trim()     || null,
      taxId:       taxId?.trim()       || null,
      crmNotes:    crmNotes?.trim()    || null,
      preferencias: preferencias?.trim() || null,
      referredBy:  referredBy?.trim()  || null,
    },
  });
  return ok(client, 201);
}
