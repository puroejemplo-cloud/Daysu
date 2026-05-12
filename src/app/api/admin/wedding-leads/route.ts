import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { WeddingLeadStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as WeddingLeadStatus | null;

  const leads = await prisma.weddingLead.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true } },
    },
  });

  return ok(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const body = await req.json() as {
    name: string;
    email: string;
    phone?: string;
    eventType: string;
    eventDate?: string;
    guestCount?: number;
    budget?: string;
    message?: string;
  };

  if (!body.name || !body.email || !body.eventType) {
    return err("name, email y eventType son requeridos");
  }

  const lead = await prisma.weddingLead.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      eventType: body.eventType,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      guestCount: body.guestCount,
      budget: body.budget,
      message: body.message,
      status: "new",
    },
    include: {
      client: { select: { id: true, fullName: true } },
    },
  });

  return ok(lead);
}
