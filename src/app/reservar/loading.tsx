export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", padding: "2.5rem 1rem" }}>
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <div className="skeleton" style={{ width: 100, height: 10, borderRadius: 4, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ width: 220, height: 40, borderRadius: 6, marginBottom: "0.75rem" }} />
        <div className="skeleton" style={{ width: 340, height: 14, borderRadius: 4, marginBottom: "2rem" }} />
        {/* Stepper */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
              <div className="skeleton" style={{ width: 64, height: 10, borderRadius: 4 }} />
              {i < 4 && <div className="skeleton" style={{ width: 20, height: 2 }} />}
            </div>
          ))}
        </div>
        {/* Form card */}
        <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
      </div>
    </div>
  );
}
