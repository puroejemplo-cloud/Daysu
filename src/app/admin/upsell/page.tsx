import UpsellAdmin from "@/components/admin/UpsellAdmin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UpsellAdminPage() {
  // "Cuando elija" — solo rentables (paquetes y productos)
  // "Sugerir"      — todos los activos activos (incluyendo componentes add-on)
  const [sourceAssets, suggestAssets] = await Promise.all([
    prisma.asset.findMany({
      where: { isActive: true, isRentable: true },
      select: { id: true, name: true, isRecommended: true },
      orderBy: { name: "asc" },
    }),
    prisma.asset.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isRecommended: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <div className="admin-page" style={{ maxWidth: "56rem" }}>
      <header className="admin-page-header">
        <p className="admin-label">Marketing</p>
        <h1 className="admin-page-title">Reglas de Upselling</h1>
        <p className="admin-page-desc">Define qué artículos sugerir cuando el cliente selecciona ciertos equipos.</p>
      </header>
      <UpsellAdmin sourceAssets={sourceAssets} suggestAssets={suggestAssets} />
    </div>
  );
}
