export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", padding: "5rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div className="skeleton" style={{ width: 120, height: 10, borderRadius: 4, marginBottom: "0.75rem" }} />
        <div className="skeleton" style={{ width: 280, height: 36, borderRadius: 6, marginBottom: "2rem" }} />
        {/* Pills de categoría */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          {[80, 110, 90, 130, 100].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 34, borderRadius: 999 }} />
          ))}
        </div>
        {/* Grid de cards */}
        <div className="catalog-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 320, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
