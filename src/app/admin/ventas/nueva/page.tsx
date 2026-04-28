import ManualSaleForm from "@/components/admin/ManualSaleForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NuevaVentaPage() {
  const categories = await prisma.assetCategory.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <p className="section-label">Ventas</p>
      <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Registrar Venta Manual</h1>
      <p className="mb-8" style={{ color: "#94A3B8" }}>
        Registra un evento que cerraste directamente. Los productos quedan bloqueados para esas fechas.
      </p>
      <ManualSaleForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
