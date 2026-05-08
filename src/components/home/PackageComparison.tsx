"use client";
import Link from "next/link";

interface DbPkg {
  id: number; name: string; sku: string;
  dailyRate: string; maxGuests: number | null;
  isRecommended?: boolean;
}

// Datos base (colores, popularidad, capacidad fallback, SKU de referencia)
const PKGS_BASE = [
  { name: "Básico",     price: 4600,  cap: 100,  color: "#9333ea", sku: "PKG-BASICO",     popular: false },
  { name: "Mediano",    price: 8000,  cap: 200,  color: "#f472b6", sku: "PKG-MEDIANO",    popular: true  },
  { name: "Premium",    price: 14500, cap: 200,  color: "#38bdf8", sku: "PKG-PREMIUM",    popular: false },
  { name: "Master VIP", price: 19000, cap: 500,  color: "#f59e0b", sku: "PKG-MASTER-VIP", popular: false },
  { name: "Diamante",   price: 21500, cap: 500,  color: "#fbbf24", sku: "PKG-DIAMANTE",   popular: false },
];

type Val = boolean | string;
const FEATURES: { label: string; vals: Val[] }[] = [
  { label: "DJ Versátil",                      vals: [true, true, true, true, true]     },
  { label: "Audio básico (hasta 200 inv.)",     vals: [true, true, false, false, false]  },
  { label: "Audio profesional (hasta 500 inv.)",vals: [false, false, true, true, true]   },
  { label: "Cabina LED pixel",                  vals: [true, true, true, true, true]     },
  { label: "Iluminación básica",                vals: [false, true, false, false, false] },
  { label: "Iluminación profesional",           vals: [false, false, true, true, true]   },
  { label: "Show Robot Led",                    vals: [false, true, true, true, true]    },
  { label: "Show Cabezones",                    vals: [false, false, "1", "2", "2"]      },
  { label: "Carrito de shots",                  vals: [false, false, false, "200 pzas", "250 pzas"] },
  { label: "Maestro de ceremonias",             vals: [false, false, true, true, true]   },
  { label: "Proyección + Video semblanza",      vals: [false, false, true, true, true]   },
  { label: "Pirotecnia inalámbrica",            vals: [false, false, "4 chisperos", "6 chisperos", "6 chisperos"] },
  { label: "Animadores caracterizados",         vals: [false, false, false, true, true]  },
  { label: "Arlequín en zancos",                vals: [false, false, false, false, true] },
  { label: "Vals en las nubes",                 vals: [false, false, false, false, "Sencillo"] },
  { label: "Cañón de confeti + Shot jeringas",  vals: [false, false, false, false, true] },
];

function Cell({ val, color }: { val: Val; color: string }) {
  if (val === false) return <span style={{ color: "#334155", fontSize: "1rem" }} aria-label="No incluido">—</span>;
  if (val === true)  return <span style={{ color, fontSize: "1.1rem", filter: "drop-shadow(0 0 4px currentColor)" }} aria-label="Incluido">✓</span>;
  return <span style={{ color, fontSize: "0.72rem", fontWeight: 700 }}>{val}</span>;
}

export default function PackageComparison({
  packages,
  onSelect,
}: {
  packages?: DbPkg[];
  onSelect?: (id: number) => void;
} = {}) {
  // Fusionar datos de BD con colores/features hardcodeados
  // Solo muestra paquetes que existen en BD (si se pasan)
  const PKGS = PKGS_BASE.map((base) => {
    const dbPkg = packages?.find((p) => p.sku === base.sku);
    if (packages && !dbPkg) return null;
    return {
      ...base,
      id:      dbPkg?.id ?? null,
      price:   dbPkg ? Number(dbPkg.dailyRate) : base.price,
      name:    dbPkg?.name ?? base.name,
      cap:     dbPkg?.maxGuests ?? base.cap,
      popular: dbPkg?.isRecommended ?? base.popular, // usa BD si disponible
    };
  }).filter(Boolean) as Array<typeof PKGS_BASE[0] & { id: number | null }>;

  if (PKGS.length === 0) return null;

  return (
    <section style={{ padding: "4rem 0 5rem", borderTop: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.25rem" }}>
        <p className="section-label" style={{ textAlign: "center" }}>Encuentra tu paquete</p>
        <h2 className="section-title bebas" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          Comparar paquetes
        </h2>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.88rem", marginBottom: "0.5rem" }}>
          Todos los paquetes incluyen <strong style={{ color: "var(--cream)" }}>5 hrs de servicio + 1 hr de bienvenida</strong>
        </p>
        <p style={{ textAlign: "center", color: "#475569", fontSize: "0.78rem", marginBottom: "2.5rem" }}>
          Las 5 hrs + bienvenida aplican exclusivamente a paquetes · Zona Zacatecas–Guadalupe
        </p>
      </div>

      {/* ── VISTA TARJETAS (móvil < 640px) ── */}
      <div className="sm:hidden" style={{ padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {PKGS.map((p) => {
          const pkgFeatures = FEATURES.filter((f) => f.vals[PKGS.indexOf(p)] !== false);
          return (
            <div key={p.sku}
              style={{
                border: p.popular ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,.08)",
                borderRadius: 16,
                background: p.popular ? `linear-gradient(135deg, ${p.color}10, transparent)` : "#0a0a18",
                padding: "1.5rem",
                position: "relative",
                overflow: "hidden",
              }}>
              {p.popular && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: p.color, color: ["#fbbf24","#f59e0b"].includes(p.color) ? "#05051a" : "#fff",
                  fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", padding: "0.2rem 0.6rem", borderRadius: 999,
                }}>
                  ⭐ Más popular
                </div>
              )}
              <div style={{ color: p.color, fontWeight: 900, fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                {p.name}
              </div>
              <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.15rem" }}>
                ${p.price.toLocaleString("es-MX")}
                <span style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 400, marginLeft: "0.4rem" }}>MXN</span>
              </div>
              <div style={{ color: "#475569", fontSize: "0.72rem", marginBottom: "1rem" }}>
                👥 {p.cap === 100 ? "hasta 100" : p.cap === 200 ? "hasta 200" : "50–500"} invitados
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1.25rem" }}>
                {pkgFeatures.map((f) => (
                  <li key={f.label} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.78rem", color: "#94a3b8" }}>
                    <span style={{ color: p.color, flexShrink: 0, lineHeight: "1.4" }}>✦</span>
                    {f.label}{typeof f.vals[PKGS.indexOf(p)] === "string" ? `: ${f.vals[PKGS.indexOf(p)]}` : ""}
                  </li>
                ))}
              </ul>
              {onSelect && p.id ? (
                <button onClick={() => onSelect(p.id!)}
                  style={{
                    display: "block", width: "100%", textAlign: "center", padding: "0.65rem",
                    borderRadius: 999, fontSize: "0.8rem", fontWeight: 700,
                    background: p.color, color: ["#fbbf24","#f59e0b"].includes(p.color) ? "#05051a" : "#fff",
                    border: "none", cursor: "pointer",
                  }}>
                  ✓ Seleccionar {p.name}
                </button>
              ) : (
                <Link href={`/reservar?asset=${p.id ?? p.sku}`}
                  style={{
                    display: "block", textAlign: "center", padding: "0.65rem",
                    borderRadius: 999, fontSize: "0.8rem", fontWeight: 700,
                    background: p.color, color: ["#fbbf24","#f59e0b"].includes(p.color) ? "#05051a" : "#fff",
                    textDecoration: "none",
                  }}>
                  Cotizar {p.name} →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* ── TABLA DESKTOP (≥ 640px) ── */}
      <div className="hidden sm:block" style={{ overflowX: "auto", padding: "0 1.25rem" }}>
        <table
          style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: "0.82rem" }}
          aria-label="Comparación de paquetes de Daysu.vip">
          <thead>
            <tr>
              <th scope="col" style={{ padding: "1rem 1rem", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", width: "30%" }}>
                Servicio incluido
              </th>
              {PKGS.map((p) => (
                <th key={p.sku} scope="col"
                  style={{
                    padding: "0.75rem 0.5rem", textAlign: "center", minWidth: 100,
                    background: p.popular ? `${p.color}10` : "transparent",
                    borderRadius: p.popular ? "12px 12px 0 0" : undefined,
                    position: "relative",
                  }}>
                  {p.popular && (
                    <div style={{
                      position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
                      background: p.color, color: "#fff",
                      fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "0.2rem 0.75rem", borderRadius: "0 0 8px 8px", whiteSpace: "nowrap",
                    }}>
                      ⭐ Más popular
                    </div>
                  )}
                  <div style={{ color: p.color, fontWeight: 900, fontSize: "0.9rem", letterSpacing: "0.05em", marginTop: p.popular ? "1.4rem" : 0 }}>
                    {p.name}
                  </div>
                  <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.82rem", marginTop: "0.2rem" }}>
                    ${p.price.toLocaleString("es-MX")}
                  </div>
                  <div style={{ color: "#475569", fontSize: "0.68rem", marginTop: "0.15rem" }}>
                    👥 {p.cap === 100 ? "hasta 100" : p.cap === 200 ? "hasta 200" : "50–500"} inv.
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              <td colSpan={PKGS.length + 1} style={{ padding: 0 }}>
                <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(232,25,138,.3), transparent)" }} />
              </td>
            </tr>
          </thead>

          <tbody>
            {FEATURES.map((f, i) => (
              <tr key={f.label}
                style={{ background: i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent" }}>
                <td scope="row" style={{ padding: "0.65rem 1rem", color: "#94a3b8" }}>{f.label}</td>
                {PKGS.map((p, pi) => (
                  <td key={p.sku} style={{
                    padding: "0.65rem 0.5rem", textAlign: "center",
                    background: p.popular ? `${p.color}06` : "transparent",
                  }}>
                    <Cell val={f.vals[pi]} color={p.color} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td style={{ padding: "1.25rem 1rem", color: "#475569", fontSize: "0.72rem" }}>
                * Sujeto a disponibilidad de fecha
              </td>
              {PKGS.map((p) => (
                <td key={p.sku} style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                  {onSelect && p.id ? (
                    <button onClick={() => onSelect(p.id!)}
                      style={{
                        display: "inline-block", padding: "0.45rem 0.85rem",
                        borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                        background: p.color, color: ["#fbbf24","#f59e0b"].includes(p.color) ? "#05051a" : "#fff",
                        border: "none", cursor: "pointer", transition: "opacity 0.2s",
                      }}>
                      ✓ Seleccionar
                    </button>
                  ) : (
                    <Link href={`/catalogo/${p.sku.toLowerCase()}`}
                      style={{
                        display: "inline-block", padding: "0.45rem 0.85rem",
                        borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                        background: p.color, color: ["#fbbf24","#f59e0b"].includes(p.color) ? "#05051a" : "#fff",
                        textDecoration: "none", transition: "opacity 0.2s",
                      }}>
                      Cotizar
                    </Link>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
