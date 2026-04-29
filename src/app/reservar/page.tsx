import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ReservarContent from "./ReservarContent";

export const metadata: Metadata = {
  title: "Cotiza tu evento",
  description: "Reserva tu paquete con 30% de depósito. Tu fecha queda apartada por 48 horas. Bodas, XV Años y eventos en Zacatecas.",
  openGraph: {
    title: "Cotiza tu evento — Daysu.vip",
    description: "Reserva con 30% de depósito. Cobertura en Zacatecas–Guadalupe.",
  },
};

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: { asset?: string; sh?: string; start?: string };
}) {
  // Paquetes activos de la BD para el comparador
  const packages = await prisma.asset.findMany({
    where: { isActive: true, isRentable: true, assetType: "package" },
    select: { id: true, name: true, sku: true, dailyRate: true, maxGuests: true },
    orderBy: { dailyRate: "asc" },
  });

  // Si viene ?asset=ID desde el catálogo, inicializar el wizard con ese paquete
  const initialAssetId = searchParams.asset
    ? parseInt(searchParams.asset, 10) || null
    : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: `
        radial-gradient(ellipse 70% 35% at 50% 0%, rgba(124,58,237,0.10) 0%, transparent 65%),
        radial-gradient(ellipse 50% 25% at 100% 100%, rgba(201,168,76,0.05) 0%, transparent 60%),
        #05051a
      `,
    }}>
      <div className="max-w-5xl mx-auto px-4 py-10" style={{ position: "relative", zIndex: 1 }}>
        <p className="section-label">Reserva tu fecha</p>
        <h1 className="bebas text-white mb-1" style={{ fontSize: "2.8rem" }}>
          Cotiza tu evento
        </h1>
        <p className="mb-8 text-sm" style={{ color: "#94a3b8" }}>
          Completa el formulario — tu fecha quedará apartada por 48 hrs.
        </p>

        <ReservarContent
          packages={packages.map((p) => ({
            ...p,
            dailyRate: p.dailyRate.toString(),
          }))}
          initialAssetId={initialAssetId}
        />
      </div>
    </div>
  );
}
