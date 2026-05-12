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

