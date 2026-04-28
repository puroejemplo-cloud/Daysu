export default function BookingWizardSkeleton() {
  return (
    <div className="aura-card p-6 space-y-5" aria-busy="true" aria-label="Cargando formulario de reserva">
      {/* Stepper */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
            <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 6 }} />
            {i < 4 && <div className="skeleton" style={{ width: 20, height: 2, borderRadius: 2 }} />}
          </div>
        ))}
      </div>
      {/* Campos */}
      {[140, 100, 120].map((w, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="skeleton" style={{ width: w, height: 10, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: "100%", height: 42, borderRadius: 8 }} />
        </div>
      ))}
      {/* Botón */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
        <div className="skeleton" style={{ width: 140, height: 44, borderRadius: 6 }} />
      </div>
    </div>
  );
}
