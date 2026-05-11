import ManualSaleForm from "@/components/admin/ManualSaleForm";
import { prisma } from "@/lib/prisma";


export default async function NuevaVentaPage() {
  const categories = await prisma.assetCategory.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="admin-page" style={{ maxWidth: "52rem" }}>
      <header className="admin-page-header">
        <p className="admin-label">Ventas</p>
        <h1 className="admin-page-title">Registrar Venta Manual</h1>
        <p className="admin-page-desc">Registra un evento cerrado directamente. Los productos quedan bloqueados para esas fechas.</p>
      </header>
      <ManualSaleForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
