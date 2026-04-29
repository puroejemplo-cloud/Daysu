"use client";
import { useState, useRef, useEffect } from "react";
import { Suspense } from "react";
import BookingWizard from "@/components/booking/BookingWizard";
import BookingWizardSkeleton from "@/components/booking/BookingWizardSkeleton";
import BookingWizardErrorBoundary from "@/components/booking/BookingWizardErrorBoundary";
import PackageComparison from "@/components/home/PackageComparison";

interface DbPkg {
  id: number; name: string; sku: string;
  dailyRate: string; maxGuests: number | null;
}

export default function ReservarContent({
  packages,
  initialAssetId,
}: {
  packages: DbPkg[];
  initialAssetId: number | null;
}) {
  const [selectedPkgId, setSelectedPkgId] = useState<number | null>(initialAssetId);
  const wizardRef     = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleSelectPackage = (id: number) => {
    setSelectedPkgId(id);
    // Scroll suave al wizard y esperar un tick para que el DOM actualice
    setTimeout(() => {
      wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* ── Wizard ── */}
      <div ref={wizardRef}>
        <BookingWizardErrorBoundary>
          <Suspense fallback={<BookingWizardSkeleton />}>
            <BookingWizard forcedAssetId={selectedPkgId} />
          </Suspense>
        </BookingWizardErrorBoundary>
      </div>

      {/* ── CTA al comparador ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={scrollToComparison}
        onKeyDown={(e) => e.key === "Enter" && scrollToComparison()}
        style={{
          margin: "1.5rem 0 0",
          padding: "1rem 1.5rem",
          borderRadius: 12,
          background: "rgba(201,168,76,0.06)",
          border: "1px solid rgba(201,168,76,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          cursor: "pointer",
          transition: "background 0.2s",
          userSelect: "none",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.1)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.06)")}>
        <div>
          <p style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.9rem" }}>
            ¿Aún no decides qué paquete? Mira el comparador
          </p>
          <p style={{ color: "#52525b", fontSize: "0.78rem", marginTop: "0.15rem" }}>
            Selecciona un paquete desde la tabla y el formulario se actualiza automáticamente
          </p>
        </div>
        <span style={{
          color: "var(--gold)", fontSize: "1.4rem", lineHeight: 1,
          animation: "arrowBounce 1.4s ease-in-out infinite",
          flexShrink: 0,
        }}>↓</span>
      </div>

      {/* ── Comparador ── */}
      <div ref={comparisonRef} style={{ marginTop: "1.5rem" }}>
        <PackageComparison packages={packages} onSelect={handleSelectPackage} />
      </div>
    </div>
  );
}
