export default function Loading() {
  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 1rem" }}>
      <div className="skeleton" style={{ width: 120, height: 10, borderRadius: 4, marginBottom: "0.5rem" }} />
      <div className="skeleton" style={{ width: 260, height: 32, borderRadius: 6, marginBottom: "0.5rem" }} />
      <div className="skeleton" style={{ width: 380, height: 14, borderRadius: 4, marginBottom: "2rem" }} />
      {/* Quick access grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
        ))}
      </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />
        ))}
      </div>
      {/* Bookings list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
