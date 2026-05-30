import type { Metadata } from "next";
import ConfigPanel from "./ConfigPanel";
import HomepagePackagesPanel from "./HomepagePackagesPanel";
import CatalogOrderPanel from "./CatalogOrderPanel";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Configuración del sistema",
  robots: { index: false },
};

export default async function ConfiguracionPage() {
  const [packages, homepageSetting, categories, catalogOrderSetting] = await Promise.all([
    prisma.asset.findMany({
      where: { isActive: true, isRentable: true, assetType: "package" },
      select: { id: true, name: true, sku: true, dailyRate: true },
      orderBy: { dailyRate: "asc" },
    }),
    prisma.systemSetting.findUnique({ where: { key: "homepage_packages" } }),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.systemSetting.findUnique({ where: { key: "catalog_category_order" } }),
  ]);

  let initialSelected: number[] = [];
  try {
    if (homepageSetting?.value) initialSelected = JSON.parse(homepageSetting.value);
  } catch { /* inválido, muestra todos */ }

  let initialCatalogOrder: number[] = [];
  try {
    if (catalogOrderSetting?.value) initialCatalogOrder = JSON.parse(catalogOrderSetting.value);
  } catch { /* inválido, usa alfabético */ }

  return (
    <div className="admin-page" style={{ maxWidth: "52rem" }}>
      <header className="admin-page-header">
        <p className="admin-label">Sistema</p>
        <h1 className="admin-page-title">Configuración</h1>
        <p className="admin-page-desc">Parámetros operativos. Los cambios se aplican inmediatamente.</p>
      </header>

      <ConfigPanel />

      <hr className="admin-divider" style={{ margin: "2rem 0" }} />

      <div style={{ marginBottom: "1rem" }}>
        <p className="admin-label">Catálogo</p>
        <h2 className="admin-page-title" style={{ fontSize: "1.2rem" }}>Orden de categorías</h2>
      </div>
      <CatalogOrderPanel
        categories={categories}
        initialOrder={initialCatalogOrder}
      />

      <hr className="admin-divider" style={{ margin: "2rem 0" }} />

      <div style={{ marginBottom: "1rem" }}>
        <p className="admin-label">Inicio</p>
        <h2 className="admin-page-title" style={{ fontSize: "1.2rem" }}>Paquetes destacados</h2>
      </div>
      <HomepagePackagesPanel
        packages={packages.map((p) => ({ ...p, dailyRate: p.dailyRate.toString() }))}
        initialSelected={initialSelected}
      />
    </div>
  );
}
