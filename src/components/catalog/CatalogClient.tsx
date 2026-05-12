"use client";
import { useState, useCallback, useEffect } from "react";
import { getHourlyTiers, getCapacityTiers, isPerPerson, getMinPersons, type PricingConfig } from "@/lib/product-tiers";
import CardCarousel from "./CardCarousel";
import { useSearchParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { CalendarDays, PackageSearch, Sparkles } from "lucide-react";

// Calculador interactivo de precio por persona (necesita su propio estado)
function PersonCalc({ pricePerPerson, accent, minPersons = 25 }: { pricePerPerson: number; accent: string; minPersons?: number }) {
  const [persons, setPersons] = useState(minPersons);
  const total = pricePerPerson * persons;
  const change = (delta: number) => setPersons((p) => Math.max(minPersons, p + delta));
  return (
    <div
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      style={{ padding: "0.65rem 0.75rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${accent}20` }}>
      <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.5rem" }}>
        Por persona
      </p>
      <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
        ${pricePerPerson.toLocaleString("es-MX")} MXN / persona
      </p>
      {/* Selector de personas */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
        <button onClick={() => change(-5)}
          style={{ minWidth: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}>−5</button>
        <button onClick={() => change(-1)}
          style={{ minWidth: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}>−</button>
        <input
          type="number" min={1} value={persons}
          onChange={(e) => setPersons(Math.max(1, Number(e.target.value) || 1))}
          style={{
            width: 52, textAlign: "center", background: "#18181b",
            border: `1px solid ${accent}40`, borderRadius: 6,
            color: "#fff", fontWeight: 700, fontSize: "0.85rem", padding: "0.2rem 0.3rem",
          }} />
        <button onClick={() => change(1)}
          style={{ minWidth: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}>+</button>
        <button onClick={() => change(5)}
          style={{ minWidth: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}>+5</button>
        <span style={{ fontSize: "0.65rem", color: "#475569" }}>personas</span>
      </div>
      {/* Total */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Total:</span>
        <span style={{ fontSize: "1.4rem", fontWeight: 300, letterSpacing: "-0.04em", color: "#FF3DA8", textShadow: "0 0 16px rgba(255,61,168,0.3)", lineHeight: 1 }}>
          ${total.toLocaleString("es-MX")}
        </span>
        <span style={{ fontSize: "0.6rem", color: "#52525b" }}>MXN</span>
      </div>
    </div>
  );
}

interface Category { id: number; name: string }
interface AssetInfo {
  id: number; name: string; sku: string;
  dailyRate: string; originalPrice: string | null;
  categoryId: number; extraCategoryIds?: number[]; description: string | null;
  ownerName: string | null; categoryName: string | null;
  pricingTiers?: PricingConfig | null;
  imageUrl?: string | null;
  imageGallery?: string[];
  componentNames?: string[];
}
interface AssetAvail {
  assetId: number; availableUnits: number; isAvailable: boolean; reservedUnits: number;
}

const ACCENT_PALETTE = ["#e879f9", "#f472b6", "#38bdf8", "#f59e0b", "#a78bfa", "#4ade80", "#fb923c"];

// Iconos por categoría
const CAT_ICONS: Record<string, string> = {
  "Paquetes": "🎉", "Sonido": "🔊", "Iluminación": "💡", "Entretenimiento": "🎭",
  "Fotografía": "📷", "Staff": "👤", "Mobiliario": "🪑", "Cabinas": "📸",
  "Todos": "✦",
};

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

  useEffect(() => {
    const date = searchParams.get("date");
    const sh   = searchParams.get("sh");
    if (date) setRange({ from: new Date(date + "T12:00:00"), to: undefined });
    if (sh)   setSetupHour(sh);
  }, [searchParams]);

  const [avail,      setAvail]      = useState<Record<number, AssetAvail>>({});
  const [loading,    setLoading]    = useState(false);
  const [catFilter,  setCatFilter]  = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [checked,    setChecked]    = useState(false);

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

  const shown = (catFilter
    ? assets.filter((a) => a.categoryId === catFilter || (a.extraCategoryIds ?? []).includes(catFilter))
    : assets)
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
        radial-gradient(ellipse 80% 40% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 60%),
        radial-gradient(ellipse 45% 30% at 5%  80%, rgba(232,25,138,0.06) 0%, transparent 55%),
        radial-gradient(ellipse 45% 30% at 95% 80%, rgba(56,189,248,0.04) 0%, transparent 55%),
        #05051a
      `,
    }}>

      {/* ── HEADER ── */}
      <div style={{ position: "relative", overflow: "hidden", padding: "4.5rem 1rem 3rem", textAlign: "center", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)" }} />

        <p style={{ position: "relative", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em",
          textTransform: "uppercase", color: "#9333EA", marginBottom: "1rem",
          display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Sparkles size={12} /> Disponibilidad en tiempo real
        </p>
        <h1 style={{
          position: "relative",
          fontFamily: "var(--font-bebas)",
          fontSize: "clamp(3.2rem,7vw,6rem)",
          lineHeight: 1, letterSpacing: "0.02em", marginBottom: "1rem",
          background: "linear-gradient(135deg, #f4f4f5 30%, #a78bfa 70%, #e879f9 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Nuestros Servicios
        </h1>
        <p style={{ position: "relative", maxWidth: 480, margin: "0 auto", color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Selecciona la fecha de tu evento para verificar disponibilidad al instante.
        </p>
      </div>

      {/* ── FILTROS DE CATEGORÍA ── */}
      <div style={{
        display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center",
        padding: "0 1rem 1.5rem", position: "relative", zIndex: 10,
      }}>
        {[{ id: null, name: "Todos" }, ...categories].map((c, ci) => {
          const isActive = catFilter === c.id;
          const accent   = c.id ? ACCENT_PALETTE[ci % ACCENT_PALETTE.length] : "#E8198A";
          const icon     = CAT_ICONS[c.name] ?? "✦";
          return (
            <button key={c.id ?? "all"}
              onClick={() => setCatFilter(c.id)}
              style={{
                padding: "0.5rem 1.2rem", borderRadius: 999,
                fontSize: "0.78rem", fontWeight: 700, minHeight: 40,
                border: "1px solid", cursor: "pointer", transition: "all 0.2s",
                WebkitTapHighlightColor: "transparent",
                display: "flex", alignItems: "center", gap: "0.35rem",
                background: isActive ? accent : "rgba(255,255,255,0.04)",
                borderColor: isActive ? accent : "rgba(255,255,255,0.1)",
                color: isActive ? "#05051a" : "#71717a",
                boxShadow: isActive ? `0 0 16px ${accent}50` : "none",
              }}>
              <span>{icon}</span>
              {c.name}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem 5rem", position: "relative", zIndex: 1 }}>

        {/* ── SELECTOR DE FECHA ── */}
        <div style={{
          padding: "1.5rem",
          marginBottom: "2.5rem",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(232,25,138,0.2)",
          boxShadow: "0 0 40px rgba(232,25,138,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, #E8198A, transparent)",
          }} />
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
                  border: showPicker ? "1px solid rgba(232,25,138,0.5)" : "1px solid rgba(255,255,255,0.08)",
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
              className="btn-gold"
              style={{
                opacity: !range.from ? 0.45 : 1, cursor: !range.from ? "not-allowed" : "pointer",
                boxShadow: range.from ? "0 0 20px rgba(232,25,138,0.3)" : "none",
              }}>
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

        {/* ── SKELETON ── */}
        {loading && (
          <div className="catalog-grid" style={{ marginTop: "1rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" }}>
                <div className="skeleton" style={{ height: 220 }} />
                <div style={{ padding: "1.2rem", background: "#0c0c10", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 99 }} />
                  <div className="skeleton" style={{ height: 28, width: "80%" }} />
                  <div className="skeleton" style={{ height: 14, width: "40%" }} />
                  <div className="skeleton" style={{ height: 10, width: "90%" }} />
                  <div className="skeleton" style={{ height: 10, width: "70%" }} />
                  <div className="skeleton" style={{ height: 40, borderRadius: 8, marginTop: "0.5rem" }} />
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
              const features  = descLines.length > 0 ? descLines : comps;
              const isPromo   = !!asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate);
              const discount  = isPromo ? Math.round((1 - Number(asset.dailyRate) / Number(asset.originalPrice!)) * 100) : 0;

              const cardHref = range.from
                ? `/catalogo/${asset.sku.toLowerCase()}?start=${range.from.toISOString()}&sh=${setupHour}`
                : `/catalogo/${asset.sku.toLowerCase()}`;

              return (
                <Link key={asset.id}
                  href={cardHref}
                  className={`pkg-card-v2${checked && !isAvail ? " unavailable" : ""}`}
                  style={{
                    textDecoration: "none", display: "flex", flexDirection: "column",
                    "--card-accent": accent + "55",
                    "--card-glow":   accent + "12",
                  } as React.CSSProperties}>

                  {/* Línea de acento superior */}
                  <div style={{
                    height: 3, flexShrink: 0,
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    opacity: 0.7,
                  }} />

                  {/* ── Imagen ── */}
                  <div style={{ position: "relative" }}>
                    {gallery.length > 0 ? (
                      <CardCarousel images={gallery} alt={asset.name} className="catalog-card-img" />
                    ) : (
                      <div className="catalog-card-img" style={{
                        background: `linear-gradient(135deg, #0c0c10 0%, ${accent}18 100%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontFamily: "var(--font-bebas)", fontSize: "3.5rem", color: `${accent}40`, letterSpacing: "0.05em" }}>
                          {asset.name.split(" ")[0]}
                        </span>
                      </div>
                    )}

                    {/* Badge disponibilidad */}
                    {checked && (
                      <span style={{
                        position: "absolute", top: 10, right: 10, zIndex: 5,
                        fontSize: "0.6rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: 999,
                        background: isAvail ? "rgba(5,40,14,0.9)" : "rgba(40,5,5,0.9)",
                        color: isAvail ? "#4ade80" : "#f87171",
                        border: `1px solid ${isAvail ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
                        backdropFilter: "blur(8px)",
                        boxShadow: isAvail ? "0 0 10px rgba(74,222,128,0.2)" : "0 0 10px rgba(248,113,113,0.2)",
                      }}>
                        {isAvail ? "✓ Disponible" : "✕ No disponible"}
                      </span>
                    )}

                    {/* Badge promo */}
                    {isPromo && (
                      <span style={{
                        position: "absolute", top: 10, left: 10, zIndex: 5,
                        fontSize: "0.6rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: 999,
                        background: "#dc2626", color: "#fff",
                        boxShadow: "0 0 10px rgba(220,38,38,0.4)",
                      }}>
                        🔥 -{discount}%
                      </span>
                    )}

                    {/* Gradient + meta */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
                      background: "linear-gradient(to top, rgba(12,12,16,1) 0%, rgba(12,12,16,0.7) 50%, transparent 100%)",
                      padding: "2rem 1rem 0.75rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        {asset.categoryName && (
                          <p style={{
                            fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
                            textTransform: "uppercase", color: accent, opacity: 0.9,
                            background: `${accent}18`, border: `1px solid ${accent}30`,
                            padding: "0.2rem 0.55rem", borderRadius: 999,
                          }}>
                            {asset.categoryName}
                          </p>
                        )}
                        {gallery.length > 1 && (
                          <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", flexShrink: 0, marginLeft: "auto" }}>
                            {gallery.length} fotos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Información ── */}
                  <div style={{
                    flex: 1, padding: "1rem 1.125rem 1.25rem",
                    display: "flex", flexDirection: "column", gap: "0.75rem",
                    background: `linear-gradient(180deg, ${accent}06 0%, transparent 40%)`,
                  }}>

                    {/* Nombre */}
                    <h3 style={{
                      fontFamily: "var(--font-bebas)",
                      fontSize: "1.5rem", lineHeight: 1.1, letterSpacing: "0.01em",
                      color: "#f4f4f5", margin: 0,
                    }}>
                      {asset.name}
                    </h3>

                    {/* Features */}
                    {features.length > 0 && (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {features.slice(0, 4).map((line, li) => (
                          <li key={li} style={{
                            fontSize: "0.76rem", color: "#71717a",
                            display: "flex", alignItems: "flex-start", gap: "0.45rem", lineHeight: 1.5,
                          }}>
                            <span style={{ color: accent, fontSize: "0.48rem", marginTop: "0.4rem", flexShrink: 0, filter: `drop-shadow(0 0 3px ${accent})` }}>✦</span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Componentes BOM — tags multicolor */}
                    {descLines.length > 0 && comps.length > 0 && (
                      <div style={{ padding: "0.6rem 0.75rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#475569", marginBottom: "0.4rem" }}>
                          Incluye
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {comps.slice(0, 6).map((c, ci) => {
                            const tagAccent = ACCENT_PALETTE[(asset.id + ci) % ACCENT_PALETTE.length];
                            return (
                              <span key={ci} style={{
                                fontSize: "0.65rem", fontWeight: 500,
                                color: tagAccent,
                                background: `${tagAccent}12`,
                                border: `1px solid ${tagAccent}28`,
                                borderRadius: 5, padding: "0.15rem 0.5rem",
                              }}>
                                {c}
                              </span>
                            );
                          })}
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
                        const perPerson = isPerPerson(asset.pricingTiers ?? null);
                        return perPerson ? (
                          <PersonCalc pricePerPerson={Number(asset.dailyRate)} accent={accent} minPersons={getMinPersons(asset.pricingTiers ?? null)} />
                        ) : hTiers ? (
                          <div style={{ padding: "0.65rem 0.75rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${accent}20` }}>
                            <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>Por hora</p>
                            {hTiers.map((tier) => (
                              <div key={tier.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.2rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{tier.label}</span>
                                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#FF3DA8", letterSpacing: "-0.02em" }}>
                                  ${tier.price.toLocaleString("es-MX")} <span style={{ fontSize: "0.52rem", color: "#52525b" }}>MXN</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : cTiers ? (
                          <div style={{ padding: "0.65rem 0.75rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${accent}20` }}>
                            <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.4rem" }}>Por capacidad</p>
                            {cTiers.map((opt) => (
                              <div key={opt.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.2rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{opt.label}</span>
                                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: opt.price > 0 ? "#FF3DA8" : "#3f3f46", letterSpacing: "-0.02em" }}>
                                  {opt.price > 0 ? `$${opt.price.toLocaleString("es-MX")}` : "Por confirmar"}
                                  {opt.price > 0 && <span style={{ fontSize: "0.52rem", color: "#52525b", marginLeft: "0.2rem" }}>MXN</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                            <div>
                              {isPromo && (
                                <p style={{ fontSize: "0.72rem", color: "#52525b", textDecoration: "line-through", marginBottom: "0.1rem" }}>
                                  ${Number(asset.originalPrice).toLocaleString("es-MX")} MXN
                                </p>
                              )}
                              <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{
                                  fontSize: "1.9rem", fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1,
                                  color: "#FF3DA8",
                                  textShadow: "0 0 20px rgba(255,61,168,0.35)",
                                }}>
                                  ${Number(asset.dailyRate).toLocaleString("es-MX")}
                                </span>
                                <span style={{ fontSize: "0.62rem", color: "#52525b" }}>MXN</span>
                              </div>
                            </div>
                            {isPromo && (
                              <span style={{
                                fontSize: "0.65rem", fontWeight: 700, color: accent,
                                background: `${accent}18`, border: `1px solid ${accent}35`,
                                borderRadius: 6, padding: "0.25rem 0.65rem", flexShrink: 0,
                              }}>
                                Oferta
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* CTA */}
                    <div style={{
                      textAlign: "center", fontSize: "0.8rem", fontWeight: 700,
                      padding: "0.7rem", borderRadius: 10, marginTop: "auto",
                      background: checked && !isAvail
                        ? "transparent"
                        : `linear-gradient(135deg, ${accent}20, rgba(232,25,138,0.12))`,
                      border: `1px solid ${checked && !isAvail ? "rgba(255,255,255,0.07)" : accent + "40"}`,
                      color: checked && !isAvail ? "#3f3f46" : accent,
                      letterSpacing: "0.03em",
                      transition: "all 0.2s",
                    }}>
                      {checked && !isAvail ? "No disponible para esa fecha" : "Ver paquete →"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
