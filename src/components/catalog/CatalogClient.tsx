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

// ── Imágenes SVG por SKU ──────────────────────────────────────────────────────
const PKG_PHOTOS: Record<string, string> = {
  "DAY-MARUCHAN":     "/paquetes/pkg-maruchan.svg",
  "DAY-PISTA-LED":    "/paquetes/pkg-pista-led.svg",
  "DAY-DJ-AUDIO-100": "/paquetes/pkg-dj-audio-100.svg",
  "DAY-DJ-AUDIO-200": "/paquetes/pkg-dj-audio-200.svg",
  "DAY-DJ-AUDIO-500": "/paquetes/pkg-dj-audio-500.svg",
  "CAB-FOTO-OFERTA":  "/paquetes/cab-foto-oferta.svg",
  "PKG-BASICO":      "/paquetes/pkg-basico.svg",
  "PKG-MEDIANO":     "/paquetes/pkg-mediano.svg",
  "PKG-PREMIUM":     "/paquetes/pkg-premium.svg",
  "PKG-MASTER-VIP":  "/paquetes/pkg-master-vip.svg",
  "PKG-DIAMANTE":    "/paquetes/pkg-diamante.svg",
  "PKG-SNACK-TATOO": "/paquetes/pkg-snack-tatoo.svg",
};

// ── Contenido de cada paquete (datos reales) ──────────────────────────────────
const PKG_FEATURES: Record<string, string[]> = {
  "DAY-MARUCHAN":     ["Carrito de sopa maruchan", "Servicio para 50 personas", "Toppings y sazón incluidos", "Disponible para todos los paquetes"],
  "DAY-PISTA-LED":    ["Pista LED cristal infinito 5×5 mts", "Efecto espejo RGB multicolor", "Iluminación sincronizada con música", "Disponible para todos los paquetes"],
  "DAY-DJ-AUDIO-100": ["DJ Versátil mezclando en vivo", "Audio básico profesional · Cabina LED", "Hasta 100 personas · 5 hrs + recepción", "Ideal cumpleaños, bautizos, eventos día"],
  "DAY-DJ-AUDIO-200": ["DJ Versátil mezclando en vivo", "Audio profesional · Cabina LED", "Hasta 200 personas · 5 hrs + recepción", "Bodas, XV Años, eventos nocturnos"],
  "DAY-DJ-AUDIO-500": ["DJ Versátil mezclando en vivo", "Audio profesional completo · Cabina LED", "50 a 500 personas · 5 hrs + recepción", "Eventos grandes, bodas, corporativos"],
  "CAB-FOTO-OFERTA": ["Cabina fotográfica inflable LED", "Props y accesorios temáticos", "Galería digital · Iluminación RGB", "Operador profesional incluido"],
  "PKG-BASICO":      ["DJ Versátil + Audio básico profesional", "Cabina LED", "Souvenirs (globos)", "Ideal bautizos, cumpleaños, eventos día"],
  "PKG-MEDIANO":     ["DJ Versátil + Audio básico + Cabina LED", "Iluminación básica", "Show Robot Led + pirotecnia fría", "Souvenirs (globos)"],
  "PKG-PREMIUM":     ["DJ Versátil + Audio hasta 200 px", "Iluminación profesional de escenario", "Show Cabezones (1) + Robot Led", "Maestro de ceremonias + Proyección + Video semblanza"],
  "PKG-MASTER-VIP":  ["DJ + Audio 50-500 px + Iluminación completa", "Carrito 200 shots + Show Robot Led", "Cabezones (2) + Animadores caracterizados", "Maestro de ceremonias + Video semblanza + Pirotecnia"],
  "PKG-DIAMANTE":    ["Todo Master VIP + Shot jeringas", "Arlequín en zancos + Vals en las nubes sencillo", "Cañón de confeti metalizado + Carrito 250 shots", "Pista LED y Maruchanfest disponibles como extras"],
  "PKG-SNACK-TATOO": ["Todo Diamante + Tatoo & glitter personalizados", "Vals en las nubes doble", "Maruchanfest y Pista LED disponibles como extras", "El paquete más completo"],
};

// ── Dueño por SKU ────────────────────────────────────────────────────────────
const PKG_OWNERS: Record<string, string> = {
  "DAY-MARUCHAN":     "Sonido Daysu",
  "DAY-PISTA-LED":    "Sonido Daysu",
  "DAY-DJ-AUDIO-100": "Sonido Daysu",
  "DAY-DJ-AUDIO-200": "Sonido Daysu",
  "DAY-DJ-AUDIO-500": "Sonido Daysu",
  "PKG-BASICO":       "Sonido Daysu",
  "PKG-MEDIANO":     "Sonido Daysu",
  "PKG-PREMIUM":     "Sonido Daysu · DJ Iván Events",
  "PKG-MASTER-VIP":  "Sonido Daysu · DJ Iván Events",
  "PKG-DIAMANTE":    "Sonido Daysu · DJ Iván Events",
  "PKG-SNACK-TATOO": "Sonido Daysu · DJ Iván Events",
};

// ── Acento de color por SKU ───────────────────────────────────────────────────
const PKG_ACCENT: Record<string, string> = {
  "PKG-BASICO":      "#e879f9",
  "PKG-MEDIANO":     "#f472b6",
  "PKG-PREMIUM":     "#38bdf8",
  "PKG-MASTER-VIP":  "#f59e0b",
  "PKG-DIAMANTE":    "#fbbf24",
  "PKG-SNACK-TATOO": "#f472b6",
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

  const shown = catFilter
    ? assets.filter((a) => a.categoryId === catFilter)
    : assets;

  return (
    <div style={{
      minHeight: "100vh",
      background: `
        radial-gradient(ellipse 80% 40% at 50% 0%, rgba(124,58,237,0.09) 0%, transparent 60%),
        radial-gradient(ellipse 45% 30% at 5%  80%, rgba(201,168,76,0.05) 0%, transparent 55%),
        radial-gradient(ellipse 45% 30% at 95% 80%, rgba(201,168,76,0.04) 0%, transparent 55%),
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
                style={{ textAlign: "left", cursor: "pointer", color: range.from ? "var(--cream)" : "#64748b",
                  display: "flex", alignItems: "center", gap: "0.5rem" }}>
                📅 {dateLabel}
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
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(124,58,237,.2)", paddingTop: "1.5rem" }}>
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
          <div style={{ textAlign: "center", padding: "5rem 0", color: "#475569" }}>
            No hay servicios en esta categoría.
          </div>
        ) : !loading && (
          <div className="catalog-grid">
            {shown.map((asset) => {
              const av       = avail[asset.id];
              const isAvail  = !checked || (av?.isAvailable ?? true);
              // Galería: imágenes de BD primero, luego fallback SVG hardcoded
              const gallery  = (asset.imageGallery && asset.imageGallery.length > 0)
                ? asset.imageGallery
                : (asset.imageUrl ?? PKG_PHOTOS[asset.sku])
                  ? [(asset.imageUrl ?? PKG_PHOTOS[asset.sku]) as string]
                  : [];
              // Descripción: líneas del texto del admin
              const descLines = (asset.description ?? "")
                .split("\n").map((l) => l.trim()).filter(Boolean);
              // Componentes del BOM
              const comps     = asset.componentNames ?? [];
              const accent   = PKG_ACCENT[asset.sku] ?? "#7C3AED";
              const brand    = asset.ownerName ?? PKG_OWNERS[asset.sku] ?? "Aura Producciones";

              return (
                <div key={asset.id}
                  className={`pkg-card-v2${checked && !isAvail ? " unavailable" : ""}`}>

                  {/* Carrusel de fotos */}
                  {gallery.length > 0 && (
                    <CardCarousel
                      images={gallery}
                      alt={asset.name}
                      className="catalog-card-img"
                    />
                  )}

                  {/* Panel de contenido */}
                  <div style={{
                    flex: 1, padding: "1.25rem 1.5rem 1.5rem",
                    display: "flex", flexDirection: "column",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                  }}>
                    {/* Categoría — label neutro */}
                    {asset.categoryName && (
                      <span style={{
                        display: "inline-block", marginBottom: "0.6rem",
                        fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em",
                        textTransform: "uppercase", color: "#52525b",
                      }}>
                        {asset.categoryName}
                      </span>
                    )}

                    {/* Badge disponibilidad + label */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                      <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)" }}>
                        {brand}
                      </span>
                      {checked && (
                        <span style={{
                          fontSize: "0.62rem", fontWeight: 700, padding: "0.18rem 0.6rem", borderRadius: 999,
                          background: isAvail ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                          color: isAvail ? "#4ade80" : "#f87171",
                          border: `1px solid ${isAvail ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}`,
                        }}>
                          {isAvail ? "✓ Disponible" : "✕ Sin stock"}
                        </span>
                      )}
                    </div>

                    {/* Nombre */}
                    <h3 style={{
                      fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.2,
                      color: "#f4f4f5", letterSpacing: "-0.01em", marginBottom: "0.5rem",
                    }}>
                      {asset.name}
                    </h3>

                    {/* Descripción */}
                    {descLines.length > 0 && (
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.75rem" }}>
                        {descLines.slice(0, 4).map((line, li) => (
                          <li key={li} style={{
                            fontSize: "0.75rem", color: "#71717a",
                            display: "flex", alignItems: "flex-start", gap: "0.5rem", lineHeight: 1.5,
                          }}>
                            <span style={{ color: "rgba(201,168,76,0.5)", fontSize: "0.5rem", marginTop: "0.35rem", flexShrink: 0 }}>—</span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Precio — tipografía editorial */}
                    {(() => {
                      const hTiers = getHourlyTiers(asset.sku, asset.pricingTiers);
                      const cTiers = getCapacityTiers(asset.sku, asset.pricingTiers);
                      return hTiers ? (
                      /* Por hora */
                      <div style={{ marginBottom: "0.75rem", padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.6rem" }}>
                          Por hora
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          {hTiers.map((tier) => (
                            <div key={tier.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>{tier.label}</span>
                              <span style={{ fontSize: "1rem", fontWeight: 400, color: "#d4af37", letterSpacing: "-0.02em" }}>
                                ${tier.price.toLocaleString("es-MX")}
                                <span style={{ fontSize: "0.6rem", color: "#52525b", marginLeft: "0.2rem" }}>MXN</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : cTiers ? (
                      /* Por capacidad */
                      <div style={{ marginBottom: "0.75rem", padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.6rem" }}>
                          Por capacidad
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          {cTiers.map((opt) => (
                            <div key={opt.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>{opt.label}</span>
                              <span style={{ fontSize: "1rem", fontWeight: 400, color: opt.price > 0 ? "#d4af37" : "#3f3f46", letterSpacing: "-0.02em" }}>
                                {opt.price > 0 ? `$${opt.price.toLocaleString("es-MX")}` : "Por confirmar"}
                                {opt.price > 0 && <span style={{ fontSize: "0.6rem", color: "#52525b", marginLeft: "0.2rem" }}>MXN</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Precio estándar — elegante, no supermercado */
                      <div style={{ marginBottom: "0.75rem" }}>
                        {asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate) && (
                          <p style={{ fontSize: "0.78rem", color: "#52525b", textDecoration: "line-through", marginBottom: "0.1rem" }}>
                            ${Number(asset.originalPrice).toLocaleString("es-MX")} MXN
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                          <span style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.04em", color: "#d4af37", lineHeight: 1 }}>
                            ${Number(asset.dailyRate).toLocaleString("es-MX")}
                          </span>
                          <span style={{ fontSize: "0.65rem", color: "#52525b", fontWeight: 400 }}>MXN</span>
                          {asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate) && (
                            <span style={{ fontSize: "0.65rem", color: "#71717a", padding: "0.15rem 0.5rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4 }}>
                              Oferta
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    })()}

                    {/* Componentes del BOM (si el paquete tiene) */}
                    {comps.length > 0 && (
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569", marginBottom: "0.4rem" }}>
                          Incluye
                        </p>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {comps.slice(0, 5).map((c, ci) => (
                            <li key={ci} style={{
                              fontSize: "0.72rem", color: "rgba(245,240,232,0.75)",
                              display: "flex", alignItems: "flex-start", gap: "0.4rem", lineHeight: 1.4,
                            }}>
                              <span style={{ color: accent, fontSize: "0.52rem", marginTop: "0.2rem", flexShrink: 0 }}>✦</span>
                              {c}
                            </li>
                          ))}
                          {comps.length > 5 && (
                            <li style={{ fontSize: "0.68rem", color: "#475569" }}>
                              +{comps.length - 5} más incluidos
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <div style={{ marginTop: "auto" }}>
                      {checked && !isAvail ? (
                        <span className="btn-ghost" style={{ textAlign: "center", display: "block", fontSize: "0.75rem", opacity: 0.5, cursor: "not-allowed" }}>
                          No disponible para esa fecha
                        </span>
                      ) : (
                        <Link
                          href={
                            range.from
                              ? `/reservar?asset=${asset.id}&start=${range.from.toISOString()}&sh=${setupHour}`
                              : `/reservar?asset=${asset.id}`
                          }
                          className="btn-gold" style={{ textAlign: "center", display: "block" }}>
                          Cotizar ahora →
                        </Link>
                      )}
                    </div>
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
