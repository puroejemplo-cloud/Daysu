import ProductManager from "@/components/admin/ProductManager";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const session    = await auth();
  const categories = await prisma.assetCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <p className="section-label">Inventario</p>
      <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Productos y Paquetes</h1>
      <p className="mb-8" style={{ color: "#94A3B8" }}>
        Tus activos llevan el sufijo{" "}
        <span className="font-black" style={{ color: "var(--gold)" }}>
          [{(session?.user as { suffix?: string })?.suffix ?? "?"}]
        </span>.
        Crea <strong className="text-white">paquetes rentables</strong> o{" "}
        <strong className="text-white">componentes internos</strong> (cables, bases, accesorios que forman parte de un paquete).
      </p>
      <ProductManager
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        userSuffix={(session?.user as { suffix?: string })?.suffix ?? null}
      />
    </div>
  );
}
