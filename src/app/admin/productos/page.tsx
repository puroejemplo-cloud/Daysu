import ProductManager from "@/components/admin/ProductManager";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


export default async function ProductosPage() {
  const session    = await auth();
  const categories = await prisma.assetCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Inventario</p>
        <h1 className="admin-page-title">Productos y Paquetes</h1>
        <p className="admin-page-desc">
          Suffix{" "}
          <span style={{ color: "var(--gold)", fontWeight: 600 }}>
            [{(session?.user as { suffix?: string })?.suffix ?? "?"}]
          </span>{" "}
          · Crea paquetes rentables o componentes internos del BOM.
        </p>
      </header>
      <ProductManager
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        userSuffix={(session?.user as { suffix?: string })?.suffix ?? null}
      />
    </div>
  );
}
