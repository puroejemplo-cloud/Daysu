import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";

// GET /api/clients?q=búsqueda
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim();

  const clients = await prisma.client.findMany({
    where: q ? {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email:    { contains: q, mode: "insensitive" } },
        { phone:    { contains: q, mode: "insensitive" } },
        { company:  { contains: q, mode: "insensitive" } },
      ],
    } : undefined,
    include: {
      _count: { select: { bookings: true } },
      specialDates: { orderBy: [{ month: "asc" }, { day: "asc" }] },
      bookings: {
        where:   { status: { in: ["confirmed", "completed"] } },
        orderBy: { createdAt: "desc" },
        take:    1,
        select:  { eventName: true, setupAt: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(clients);
}
