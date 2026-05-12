import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const lead = await prisma.weddingLead.findUnique({ where: { id: Number(id) } });
  if (!lead) return err("Lead no encontrado", 404);
  if (lead.clientId) return err("Este lead ya tiene un cliente vinculado", 400);

  // Verificar si ya existe un cliente con ese email
  const existing = await prisma.client.findUnique({ where: { email: lead.email } });

  const client = existing ?? await prisma.client.create({
    data: {
      fullName: lead.name,
      email: lead.email,
      phone: lead.phone ?? undefined,
      crmNotes: `Lead Wedding Planner — ${lead.eventType}${lead.eventDate ? ` · ${lead.eventDate.toISOString().slice(0, 10)}` : ""}`,
    },
  });

  const updated = await prisma.weddingLead.update({
    where: { id: Number(id) },
    data: { clientId: client.id, status: "contacted" },
    include: {
      client: { select: { id: true, fullName: true } },
    },
  });

  return ok({ lead: updated, client });
}
