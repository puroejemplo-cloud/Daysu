"use client";
import { useState, useCallback, useEffect } from "react";
import { getHourlyTiers, getCapacityTiers, type PricingConfig } from "@/lib/product-tiers";
import CardCarousel from "./CardCarousel";
import { useSearchParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { CalendarDays, PackageSearch } from "lucide-react";

interface Category { id: number; name: string }
interface AssetInfo {
  id: number; name: string; sku: string;
  dailyRate: string; originalPrice: string | null;
  categoryId: number; description: string | null;
  ownerName: string | null; categoryName: string | null;
  pricingTiers?: PricingConfig | null;
  imageUrl?: string | null;
  imageGallery?: string[];
  componentNames?: string[];
}
interface AssetAvail {
  assetId: number; availableUnits: number; isAvailable: boolean; reservedUnits: number;
}

// Paleta de acento por índice de categoría — evita hardcodear por SKU
const ACCENT_PALETTE = ["#e879f9", "#f472b6", "#38bdf8", "#f59e0b", "#a78bfa", "#4ade80", "#fb923c"];

export default function CatalogClient({
  categories,
  assets,
}: {
  categories: Category[];
  assets: AssetInfo[];
}) {
  const searchParams = useSearchParams();
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const [setupHour, setSetupHour] = useState("19:00");

  // Pre-fill desde el hero del homepage
  useEffect(() => {
    const date = searchParams.get("date");
    const sh   = searchParams.get("sh");
    if (date) {
      setRange({ from: new Date(date + "T12:00:00"), to: undefined });
    }
    if (sh) setSetupHour(sh);
  }, [searchParams]);
  const [avail, setAvail]   = useState<Record<number, AssetAvail>>({});
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [checked, setChecked] = useState(false);

  // Hora fin = inicio + 6 horas (igual que en el wizard)
  const teardownHour = (() => {
    const [h, m] = setupHour.split(":").map(Number);
    return `${String((h + 6) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  })();

  const checkAvailability = useCallback(async () => {
    if (!range.from) return;
    const start = new Date(range.from);
    const [sh, sm] = setupHour.split(":").map(Number);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(range.from);
    const [th, tm] = teardownHour.split(":").map(Number);
    end.setHours(th, tm, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);

    setLoading(true);
    const res  = await fetch(`/api/availability?start=${start.toISOString()}&end=${end.toISOString()}`);
    const json = await res.json();
    const map: Record<number, AssetAvail> = {};
    for (const a of json.data ?? []) map[a.assetId] = a;
    setAvail(map);
    setChecked(true);
    setLoading(false);
    setShowPicker(false);
  }, [range, setupHour, teardownHour]);

  const dateLabel = range.from
    ? range.to && range.to.toDateString() !== range.from.toDateString()
      ? `${format(range.from, "d MMM", { locale: es })} → ${format(range.to!, "d MMM yyyy", { locale: es })}`
      : format(range.from, "d MMMM yyyy", { locale: es })
    : "Selecciona tu fecha";

  const shown = (catFilter ? assets.filter((a) => a.categoryId === catFilter) : assets)
    .slice()
    .sort((a, b) => {
      if (!checked) return 0;
      const aOk = avail[a.id]?.isAvailable ?? true;
      const bOk = avail[b.id]?.isAvailable ?? true;
      if (aOk && !bOk) return -1;
      if (!aOk && bOk) return 1;
      return 0;
    });

  return (
    <div style={{
      minHeight: "100vh",
      background: `
        radial-gradient(ellipse 80% 40% at 50% 0%, rgba(124,58,237,0.09) 0%, transparent 60%),
        radial-gradient(ellipse 45% 30% at 5%  80%, rgba(232,25,138,0.05) 0%, transparent 55%),
        radial-gradient(ellipse 45% 30% at 95% 80%, rgba(232,25,138,0.04) 0%, transparent 55%),
        #05051a
      `,
    }}>

      {/* ── HEADER ── todo el contenido en zIndex:1 para quedar sobre el fondo */}
      <div style={{ position: "relative", overflow: "hidden", padding: "4rem 1rem 2.5rem", textAlign: "center", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 55% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
        <p style={{ position: "relative", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em",
          textTransform: "uppercase", color: "#7C3AED", marginBottom: "0.75rem" }}>
          ✦ Disponibilidad en tiempo real
        </p>
        <h1 style={{ position: "relative", fontFamily: "var(--font-bebas)", fontSize: "clamp(2.8rem,6vw,5rem)",
          lineHeight: 1, color: "var(--cream)", marginBottom: "0.75rem", letterSpacing: "0.02em" }}>
          Nuestros Servicios
        </h1>
        <p style={{ position: "relative", maxWidth: 480, margin: "0 auto", color: "#94A3B8", fontSize: "0.88rem" }}>
          Selecciona la fecha de tu evento para verificar disponibilidad al instante.
        </p>

      </div>

      {/* ── TABS DE CATEGORÍA — fuera del header (overflow:hidden los bloqueaba en móvil) ── */}
      <div style={{
        display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center",
        padding: "1rem 1rem 0", position: "relative", zIndex: 10,
      }}>
        {[{ id: null, name: "Todos" }, ...categories].map((c) => (
          <button key={c.id ?? "all"}
            onClick={() => setCatFilter(c.id)}
            style={{
              padding: "0.5rem 1.3rem", borderRadius: 999,
              fontSize: "0.78rem", fontWeight: 600, minHeight: 40,
              border: "1px solid", cursor: "pointer", transition: "all 0.2s",
              WebkitTapHighlightColor: "transparent",
              background: catFilter === c.id ? "var(--gold)" : "rgba(255,255,255,0.04)",
              borderColor: catFilter === c.id ? "var(--gold)" : "rgba(255,255,255,0.1)",
              color: catFilter === c.id ? "#05051a" : "#71717a",
            }}>
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem 4rem", position: "relative", zIndex: 1 }}>
        {/* Las tabs de categoría también necesitan zIndex */}

        {/* ── SELECTOR DE FECHA ── */}
        <div className="aura-card" style={{ padding: "1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700,
                letterSpacing: "0.2em", textTransform: "uppercase", color: "#94A3B8", marginBottom: "0.5rem" }}>
                Fecha del evento
              </label>
              <button onClick={() => setShowPicker((v) => !v)} className="aura-input"
                style={{
                  textAlign: "left", cursor: "pointer",
                  color: range.from ? "var(--cream)" : "#64748b",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  border: showPicker ? "1px solid rgba(232,25,138,0.5)" : undefined,
                }}>
                <CalendarDays size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
                {dateLabel}
              </button>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700,
                letterSpacing: "0.2em", textTransform: "uppercase", color: "#94A3B8", marginBottom: "0.5rem" }}>
                Hora de inicio
              </label>
              <input type="time" value={setupHour}
                onChange={(e) => setSetupHour(e.target.value)}
                className="aura-input" style={{ width: 140, colorScheme: "dark" }} />
              <p style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.3rem" }}>
                Fin estimado: {teardownHour}h (+6 hrs)
              </p>
            </div>
            <button onClick={checkAvailability} disabled={!range.from || loading}
              className="btn-gold" style={{ opacity: !range.from ? 0.45 : 1, cursor: !range.from ? "not-allowed" : "pointer" }}>
              {loading ? "Consultando…" : "Ver disponibilidad ✦"}
            </button>
          </div>

          {showPicker && (
            <div className="rdp-dark" style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(232,25,138,.12)", paddingTop: "1.5rem" }}>
              <DayPicker mode="range" selected={range as never}
                onSelect={(r: unknown) => setRange((r as { from?: Date; to?: Date }) ?? {})}
                locale={es} disabled={{ before: new Date() }} numberOfMonths={2} />
            </div>
          )}
        </div>

        {/* ── FILTROS (arriba del selector de fecha) — ya movidos al header ── */}

        {/* ── SKELETON mientras carga ── */}
        {loading && (
          <div className="catalog-grid" style={{ marginTop: "1rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" }}>
                <div className="skeleton" style={{ height: 175 }} />
                <div style={{ padding: "1.2rem", background: "#05051a", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 99 }} />
                  <div className="skeleton" style={{ height: 22, width: "80%" }} />
                  <div className="skeleton" style={{ height: 16, width: "40%" }} />
                  <div className="skeleton" style={{ height: 10, width: "90%" }} />
                  <div className="skeleton" style={{ height: 10, width: "70%" }} />
                  <div className="skeleton" style={{ height: 10, width: "80%" }} />
                  <div className="skeleton" style={{ height: 36, borderRadius: 4, marginTop: "0.5rem" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GRID DE PAQUETES ── */}
        {!loading && shown.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "2rem" }}>
            <PackageSearch size={40} className="empty-state-icon" />
            <p className="empty-state-title">Sin servicios</p>
            <p className="empty-state-desc">
              {catFilter ? "No hay servicios en esta categoría." : "No hay servicios disponibles por el momento."}
            </p>
          </div>
        ) : !loading && (
          <div className="catalog-grid">
            {shown.map((asset) => {
              const av      = avail[asset.id];
              const isAvail = !checked || (av?.isAvailable ?? true);
              const gallery = (asset.imageGallery && asset.imageGallery.length > 0)
                ? asset.imageGallery
                : asset.imageUrl ? [asset.imageUrl] : [];
              const descLines = (asset.description ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
              const comps     = asset.componentNames ?? [];
              const accent    = ACCENT_PALETTE[asset.categoryId % ACCENT_PALETTE.length];
              const brand     = asset.ownerName ?? "Daysu.vip";
              const features  = descLines.length > 0 ? descLines : comps;

              return (
                <div key={asset.id}
                  className={`pkg-card-v2${checked && !isAvail ? " unavailable" : ""}`}>

                  {/* ── Imagen 1:1 con overlay ── */}
                  <div style={{ position: "relative" }}>
                    {gallery.length > 0 ? (
                      <CardCarousel images={gallery} alt={asset.name} className="catalog-card-img" />
                    ) : (
                      /* Placeholder cuando no hay foto */
                      <div className="catalog-card-img" style={{
                        background: `linear-gradient(135deg, #0c0c10 0%, ${accent}18 100%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontFamily: "var(--font-bebas)", fontSize: "3rem", color: `${accent}40`, letterSpacing: "0.05em" }}>
                          {asset.name.split(" ")[0]}
                        </span>
                      </div>
                    )}

                    {/* Badge disponibilidad — top right */}
                    {checked && (
                      <span style={{
                        position: "absolute", top: 10, right: 10, zIndex: 5,
                        fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: 999,
                        background: isAvail ? "rgba(5,40,14,0.85)" : "rgba(40,5,5,0.85)",
                        color: isAvail ? "#4ade80" : "#f87171",
                        border: `1px solid ${isAvail ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
                        backdropFilter: "blur(6px)",
                      }}>
                        {isAvail ? "✓ Disponible" : "✕ No disponible"}
                      </span>
                    )}

                    {/* Gradient + meta en la base de la imagen */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
                      background: "linear-gradient(to top, rgba(5,5,26,0.96) 0%, rgba(5,5,26,0.55) 55%, transparent 100%)",
                      padding: "1.75rem 1rem 0.85rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div style={{ minWidth: 0 }}>
                          {asset.categoryName && (
                            <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.2rem", opacity: 0.85 }}>
                              {asset.categoryName}
                            </p>
                          )}
                          <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {brand}
                          </p>
                        </div>
                        {/* Contador de fotos del carrusel visible en la imagen */}
                        {gallery.length > 1 && (
                          <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", flexShrink: 0, marginLeft: "0.5rem" }}>
                            {gallery.length} fotos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Panel de información ── */}
                  <div style={{
                    flex: 1, padding: "1rem 1.125rem 1.25rem",
                    display: "flex", flexDirection: "column",
                    gap: "0.75rem",
                  }}>

                    {/* Nombre */}
                    <h3 style={{
                      fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.25,
                      color: "#f4f4f5", letterSpacing: "-0.01em",
                      margin: 0,
                    }}>
                      {asset.name}
                    </h3>

                    {/* Features */}
                    {features.length > 0 && (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.28rem" }}>
                        {features.slice(0, 4).map((line, li) => (
                          <li key={li} style={{
                            fontSize: "0.76rem", color: "#71717a",
                            display: "flex", alignItems: "flex-start", gap: "0.45rem", lineHeight: 1.5,
                          }}>
                            <span style={{ color: accent, fontSize: "0.48rem", marginTop: "0.38rem", flexShrink: 0 }}>✦</span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Componentes BOM — solo cuando description ocupa features */}
                    {descLines.length > 0 && comps.length > 0 && (
                      <div style={{ padding: "0.6rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#475569", marginBottom: "0.35rem" }}>
                          Incluye
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {comps.slice(0, 6).map((c, ci) => (
                            <span key={ci} style={{
                              fontSize: "0.65rem", color: "rgba(245,240,232,0.65)",
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                              borderRadius: 4, padding: "0.15rem 0.5rem",
                            }}>
                              {c}
                            </span>
                          ))}
                          {comps.length > 6 && (
                            <span style={{ fontSize: "0.65rem", color: "#475569", padding: "0.15rem 0.4rem" }}>
                              +{comps.length - 6} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Precio */}
                    <div style={{ marginTop: "auto" }}>
                      {(() => {
                        const hTiers = getHourlyTiers(asset.sku, asset.pricingTiers);
                        const cTiers = getCapacityTiers(asset.sku, asset.pricingTiers);
                        return hTiers ? (
                          <div style={{ padding: "0.65rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>Por hora</p>
                            {hTiers.map((tier) => (
                              <div key={tier.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.2rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{tier.label}</span>
                                <span style={{ fontSize: "0.95rem", fontWeight: 400, color: "#FF3DA8", letterSpacing: "-0.02em" }}>
                                  ${tier.price.toLocaleString("es-MX")} <span style={{ fontSize: "0.55rem", color: "#52525b" }}>MXN</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : cTiers ? (
                          <div style={{ padding: "0.65rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>Por capacidad</p>
                            {cTiers.map((opt) => (
                              <div key={opt.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.2rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{opt.label}</span>
                                <span style={{ fontSize: "0.95rem", fontWeight: 400, color: opt.price > 0 ? "#FF3DA8" : "#3f3f46", letterSpacing: "-0.02em" }}>
                                  {opt.price > 0 ? `$${opt.price.toLocaleString("es-MX")}` : "Por confirmar"}
                                  {opt.price > 0 && <span style={{ fontSize: "0.55rem", color: "#52525b", marginLeft: "0.2rem" }}>MXN</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                            <div>
                              {asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate) && (
                                <p style={{ fontSize: "0.72rem", color: "#52525b", textDecoration: "line-through", marginBottom: "0.1rem" }}>
                                  ${Number(asset.originalPrice).toLocaleString("es-MX")} MXN
                                </p>
                              )}
                              <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{ fontSize: "1.6rem", fontWeight: 300, letterSpacing: "-0.04em", color: "#FF3DA8", lineHeight: 1 }}>
                                  ${Number(asset.dailyRate).toLocaleString("es-MX")}
                                </span>
                                <span style={{ fontSize: "0.62rem", color: "#52525b" }}>MXN</span>
                              </div>
                            </div>
                            {asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate) && (
                              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: accent, background: `${accent}18`, border: `1px solid ${accent}35`, borderRadius: 4, padding: "0.2rem 0.55rem", flexShrink: 0 }}>
                                Oferta
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* CTA */}
                    {checked && !isAvail ? (
                      <span style={{
                        textAlign: "center", display: "block", fontSize: "0.75rem",
                        padding: "0.65rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)",
                        color: "#3f3f46", cursor: "not-allowed",
                      }}>
                        No disponible para esa fecha
                      </span>
                    ) : (
                      <Link
                        href={range.from
                          ? `/catalogo/${asset.id}?start=${range.from.toISOString()}&sh=${setupHour}`
                          : `/catalogo/${asset.id}`}
                        className="btn-gold"
                        style={{ textAlign: "center", display: "block" }}>
                        Ver paquete →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
