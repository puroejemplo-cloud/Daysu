import ClientProfile from "@/components/crm/ClientProfile";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      specialDates: { orderBy: [{ month: "asc" }, { day: "asc" }] },
      bookings: {
        include: {
          items: {
            where: { isAutoBlocked: false },
            include: { asset: { select: { name: true } } },
          },
        },
        orderBy: { setupAt: "desc" },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/admin/clientes" className="text-sm font-bold mb-6 inline-flex items-center gap-1"
        style={{ color: "#94A3B8", textDecoration: "none" }}>
        ← Todos los clientes
      </Link>
      <ClientProfile client={JSON.parse(JSON.stringify(client))} />
    </div>
  );
}
