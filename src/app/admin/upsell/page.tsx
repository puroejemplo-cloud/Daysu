import UpsellAdmin from "@/components/admin/UpsellAdmin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UpsellAdminPage() {
  const assets = await prisma.asset.findMany({
    where: { isActive: true, isRentable: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">Reglas de Upselling</h1>
      <p className="text-gray-500 mb-8">
        Define qué artículos sugerir cuando el cliente selecciona ciertos equipos, y el descuento a ofrecer.
      </p>
      <UpsellAdmin assets={assets} />
    </div>
  );
}
