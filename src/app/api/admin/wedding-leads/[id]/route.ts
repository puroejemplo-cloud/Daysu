import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";
import { WeddingLeadStatus } from "@/generated/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const lead = await prisma.weddingLead.findUnique({
    where: { id: Number(id) },
    include: { client: { select: { id: true, fullName: true } } },
  });
  if (!lead) return err("No encontrado", 404);
  return ok(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const { id } = await params;
  const body = await req.json() as {
    status?: WeddingLeadStatus;
    adminNotes?: string;
    clientId?: number | null;
  };

  const lead = await prisma.weddingLead.update({
    where: { id: Number(id) },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
      ...(body.clientId !== undefined && { clientId: body.clientId }),
    },
    include: {
      client: { select: { id: true, fullName: true } },
    },
  });

  return ok(lead);
}
