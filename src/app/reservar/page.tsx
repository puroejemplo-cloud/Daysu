import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cotiza tu evento",
  description: "Reserva tu paquete con 30% de depósito. Tu fecha queda apartada por 48 horas. Bodas, XV Años y eventos en Zacatecas.",
  openGraph: {
    title: "Cotiza tu evento — Daysu.vip",
    description: "Reserva con 30% de depósito. Cobertura en Zacatecas–Guadalupe.",
  },
};
import BookingWizard from "@/components/booking/BookingWizard";
import BookingWizardSkeleton from "@/components/booking/BookingWizardSkeleton";
import BookingWizardErrorBoundary from "@/components/booking/BookingWizardErrorBoundary";
import PackageComparison from "@/components/home/PackageComparison";

export default function ReservarPage() {
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem" }}>
          <BookingWizardErrorBoundary>
            <Suspense fallback={<BookingWizardSkeleton />}>
              <BookingWizard />
            </Suspense>
          </BookingWizardErrorBoundary>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "2rem" }}>
            <p className="section-label">Compara antes de decidir</p>
            <PackageComparison />
          </div>
        </div>
      </div>
    </div>
  );
}
