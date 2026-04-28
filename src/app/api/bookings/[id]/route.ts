import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: { select: { fullName: true, email: true, phone: true } },
      items: {
        where: { isAutoBlocked: false },
        include: { asset: { select: { id: true, name: true, sku: true } } },
      },
    },
  });
  if (!booking) return err("Reserva no encontrada", 404);
  return ok(booking);
}
