import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDepositPercent } from "@/lib/bookings";
import ReservarContent from "./ReservarContent";

export const metadata: Metadata = {
  title: "Cotiza tu evento",
  description: "Reserva tu paquete en Zacatecas. Bodas, XV Años y eventos con Daysu.vip.",
  openGraph: {
    title: "Cotiza tu evento — Daysu.vip",
    description: "Reserva tu paquete. Cobertura en Zacatecas–Guadalupe.",
  },
};

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string; sh?: string; start?: string }>;
}) {
  const sp = await searchParams;

  const [packages, depositPercent] = await Promise.all([
    prisma.asset.findMany({
      where: { isActive: true, isRentable: true, assetType: "package" },
      select: { id: true, name: true, sku: true, dailyRate: true, maxGuests: true, isRecommended: true },
      orderBy: { dailyRate: "asc" },
    }),
    getDepositPercent(),
  ]);

  const initialAssetId = sp.asset ? parseInt(sp.asset, 10) || null : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: `
        radial-gradient(ellipse 70% 35% at 50% 0%, rgba(124,58,237,0.10) 0%, transparent 65%),
        radial-gradient(ellipse 50% 25% at 100% 100%, rgba(232,25,138,0.05) 0%, transparent 60%),
        #05051a
      `,
    }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem", position: "relative", zIndex: 1 }}>
        <p className="section-label">Reserva tu fecha</p>
        <h1 className="bebas" style={{ fontSize: "clamp(2.2rem,5vw,3.5rem)", color: "var(--cream)", lineHeight: 1, marginBottom: "0.5rem" }}>
          Cotiza tu evento
        </h1>
        <p style={{ color: "#71717a", fontSize: "0.88rem", marginBottom: "2.5rem" }}>
          Completa el formulario y el equipo de Daysu se pondrá en contacto contigo.
        </p>

        <ReservarContent
          packages={packages.map((p) => ({
            ...p,
            dailyRate: p.dailyRate.toString(),
          }))}
          initialAssetId={initialAssetId}
          depositPercent={depositPercent}
        />
      </div>
    </div>
  );
}
