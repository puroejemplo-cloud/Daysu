import ClientProfile from "@/components/crm/ClientProfile";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getAdminScope, clientOwnerWhere, bookingOwnerWhere } from "@/lib/adminScope";


export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session) redirect("/login");
  const scope = getAdminScope(session);

  const client = await prisma.client.findFirst({
    where: { id: Number(id), ...clientOwnerWhere(scope) },
    include: {
      specialDates: { orderBy: [{ month: "asc" }, { day: "asc" }] },
      bookings: {
        where: bookingOwnerWhere(scope),
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
    <div className="admin-page" style={{ maxWidth: "56rem" }}>
      <Link href="/admin/clientes" className="inline-flex items-center gap-1.5 text-xs font-medium mb-8"
        style={{ color: "#52525b", textDecoration: "none" }}>
        ← Clientes
      </Link>
      <ClientProfile client={JSON.parse(JSON.stringify(client))} />
    </div>
  );
}
