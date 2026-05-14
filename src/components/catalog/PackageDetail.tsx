"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarCheck, Users, Star, ChevronLeft, ChevronRight, Sparkles, Zap, Share2, Check, ChevronRight as ChevRight } from "lucide-react";
import { getHourlyTiers, getCapacityTiers, isPerPerson, getMinPersons, type PricingConfig } from "@/lib/product-tiers";
import WizardDatePicker from "@/components/booking/WizardDatePicker";

interface Asset {
  id: number; name: string; sku: string;
  dailyRate: string; originalPrice: string | null;
  description: string | null; categoryName: string; ownerName: string | null;
  imageUrl: string | null; imageGallery: string[];
  pricingTiers: PricingConfig | null;
  maxGuests: number | null; isRecommended: boolean;
  promoType: string | null; componentNames: string[];
}

interface RelatedProduct {
  id: number; name: string; sku: string;
  dailyRate: string; imageUrl: string | null; imageGallery: string[];
}

const ACCENT_PALETTE = ["#e879f9", "#f472b6", "#38bdf8", "#f59e0b", "#a78bfa", "#4ade80", "#fb923c"];

export default function PackageDetail({ asset, relatedProducts = [] }: { asset: Asset; relatedProducts?: RelatedProduct[] }) {
  const searchParams = useSearchParams();
  const initDate = searchParams.get("start")?.split("T")[0] ?? "";
  const initHour = searchParams.get("sh") ?? "19:00";

  const images = asset.imageGallery.length > 0
    ? asset.imageGallery
    : asset.imageUrl ? [asset.imageUrl] : [];

  const [activeImg,  setActiveImg]  = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/catalogo/${asset.sku.toLowerCase()}`
      : `https://daysu.vip/catalogo/${asset.sku.toLowerCase()}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: asset.name, text: `Mira este paquete en Daysu.vip: ${asset.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch { /* cancelado */ }
  }
  const [date,       setDate]       = useState(initDate);
  const [hour,       setHour]       = useState(initHour);
  const [avail,      setAvail]      = useState<boolean | null>(null);
  const [checking,   setChecking]   = useState(false);
  const minPersons = getMinPersons(asset.pricingTiers);
  const [persons,    setPersons]    = useState(minPersons);

  const descLines = (asset.description ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const features  = descLines.length > 0 ? descLines : asset.componentNames;

  const isPromo   = !!asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate);
  const discount  = isPromo ? Math.round((1 - Number(asset.dailyRate) / Number(asset.originalPrice!)) * 100) : 0;
  const hTiers    = getHourlyTiers(asset.sku, asset.pricingTiers);
  const cTiers    = getCapacityTiers(asset.sku, asset.pricingTiers);
  const accent    = ACCENT_PALETTE[asset.id % ACCENT_PALETTE.length];

  const teardownHour = (() => {
    const [h, m] = hour.split(":").map(Number);
    return `${String((h + 6) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  })();

  const checkAvailability = useCallback(async () => {
    if (!date) return;
    setChecking(true);
    const start = new Date(`${date}T${hour}:00`);
    const end   = new Date(`${date}T${teardownHour}:00`);
    if (end <= start) end.setDate(end.getDate() + 1);
    const res  = await fetch(`/api/availability?start=${start.toISOString()}&end=${end.toISOString()}&asset_id=${asset.id}`);
    const json = await res.json();
    const item = (json.data ?? []).find((a: { assetId: number }) => a.assetId === asset.id);
    setAvail(item?.isAvailable ?? true);
    setChecking(false);
  }, [date, hour, teardownHour, asset.id]);

  const reserveUrl = date
    ? `/reservar?asset=${asset.id}&start=${new Date(`${date}T${hour}:00`).toISOString()}&sh=${hour}`
    : `/reservar?asset=${asset.id}`;

  const prevImg = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % images.length);

  return (
    <div style={{ minHeight: "100vh", background: "#05051a", color: "var(--cream)" }}>

      {/* ── Ambient glow background ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 40% at 20% 20%, ${accent}12 0%, transparent 60%),
                     radial-gradient(ellipse 40% 50% at 80% 80%, #E8198A0D 0%, transparent 60%)`,
      }} />

      {/* ── Back nav ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.25rem 1.25rem 0", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/catalogo" style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          fontSize: "0.78rem", color: "#52525b", textDecoration: "none",
          transition: "color 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e4e4e7")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>

        {/* Botón compartir */}
        <button
          onClick={handleShare}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            fontSize: "0.78rem", fontWeight: 600,
            padding: "0.4rem 0.875rem",
            borderRadius: 9999,
            background: shareCopied ? `${accent}18` : "rgba(255,255,255,0.05)",
            border: `1px solid ${shareCopied ? accent + "50" : "rgba(255,255,255,0.1)"}`,
            color: shareCopied ? accent : "#71717a",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { if (!shareCopied) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLElement).style.color = "#e4e4e7"; }}}
          onMouseLeave={(e) => { if (!shareCopied) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "#71717a"; }}}
        >
          {shareCopied ? <Check size={13} strokeWidth={2.5} /> : <Share2 size={13} />}
          {shareCopied ? "¡Link copiado!" : "Compartir"}
        </button>
      </div>

      {/* ── Main layout ── */}
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.25rem 5rem",
        display: "grid", gap: "2.5rem",
        gridTemplateColumns: "1fr",
        position: "relative", zIndex: 1,
      }}
        className="pkg-detail-grid">

        {/* ── Galería ── */}
        <div>
          {/* Imagen principal — sin aspect ratio fijo, imagen completa visible */}
          <div style={{
            position: "relative", borderRadius: 20, overflow: "hidden",
            background: `linear-gradient(135deg, #0c0c1a 0%, ${accent}14 50%, #0c0c1a 100%)`,
            boxShadow: `0 0 0 1px ${accent}25, 0 20px 60px ${accent}15, 0 4px 20px rgba(0,0,0,0.6)`,
          }}>
            {images.length > 0 ? (
              <img
                key={activeImg}
                src={images[activeImg]}
                alt={`${asset.name} — foto ${activeImg + 1}`}
                style={{
                  width: "100%", height: "auto", display: "block",
                  objectFit: "contain", maxHeight: "70vh",
                  animation: "imageFadeIn 0.35s ease both",
                }}
              />
            ) : (
              <div style={{ padding: "6rem 2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3rem,8vw,6rem)", color: `${accent}30`, letterSpacing: "0.05em" }}>
                  {asset.name.split(" ")[0]}
                </span>
              </div>
            )}

            {/* Badges */}
            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: "0.5rem", zIndex: 5 }}>
              {asset.isRecommended && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "0.3rem 0.7rem", borderRadius: 999,
                  background: "var(--gold)", color: "#05051a",
                  boxShadow: "0 0 12px rgba(232,25,138,0.5)",
                }}>
                  <Star size={9} fill="currentColor" /> Recomendado
                </span>
              )}
              {isPromo && (
                <span style={{
                  fontSize: "0.62rem", fontWeight: 700, padding: "0.3rem 0.7rem", borderRadius: 999,
                  background: "#dc2626", color: "#fff",
                  boxShadow: "0 0 12px rgba(220,38,38,0.4)",
                }}>
                  🔥 -{discount}%
                </span>
              )}
            </div>

            {/* Flechas */}
            {images.length > 1 && (
              <>
                <button onClick={prevImg} aria-label="Anterior" style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#e4e4e7", cursor: "pointer", zIndex: 5, transition: "background 0.15s",
                }}><ChevronLeft size={20} /></button>
                <button onClick={nextImg} aria-label="Siguiente" style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#e4e4e7", cursor: "pointer", zIndex: 5, transition: "background 0.15s",
                }}><ChevronRight size={20} /></button>
                <span style={{
                  position: "absolute", bottom: 12, right: 14, fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(6px)", padding: "0.2rem 0.55rem", borderRadius: 999, zIndex: 5,
                }}>
                  {activeImg + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {/* Galería de fotos */}
          {images.length > 1 && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "#475569", marginBottom: "0.6rem",
                display: "flex", alignItems: "center", gap: "0.4rem",
              }}>
                <span style={{ color: accent }}>📷</span>
                Galería — {images.length} fotos
              </p>
              <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} aria-label={`Ver foto ${i + 1}`}
                    style={{
                      flexShrink: 0, width: 90, height: 68, borderRadius: 10, overflow: "hidden", padding: 0,
                      border: `2px solid ${i === activeImg ? accent : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer", transition: "all 0.2s",
                      background: "#0c0c10",
                      boxShadow: i === activeImg ? `0 0 14px ${accent}60` : "none",
                      transform: i === activeImg ? "scale(1.04)" : "scale(1)",
                      position: "relative",
                    }}>
                    <img src={src} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {i === 0 && (
                      <span style={{
                        position: "absolute", bottom: 3, left: 3,
                        fontSize: "0.45rem", fontWeight: 700, padding: "0.15rem 0.35rem",
                        borderRadius: 4, background: "rgba(5,5,26,0.85)", color: accent,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>Principal</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Panel de información ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Categoría + nombre */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span style={{
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                color: accent, background: `${accent}15`, border: `1px solid ${accent}30`,
                padding: "0.25rem 0.75rem", borderRadius: 999,
              }}>
                {asset.categoryName}
              </span>
              {asset.maxGuests && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  fontSize: "0.62rem", color: "#71717a",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  padding: "0.25rem 0.6rem", borderRadius: 999,
                }}>
                  <Users size={11} /> hasta {asset.maxGuests} inv.
                </span>
              )}
            </div>
            <h1 style={{
              fontFamily: "var(--font-bebas)", fontSize: "clamp(2.2rem,5vw,3.5rem)",
              lineHeight: 1.05, letterSpacing: "0.01em",
              background: `linear-gradient(135deg, #f4f4f5 0%, ${accent} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {asset.name}
            </h1>
          </div>

          {/* Precio */}
          <div style={{
            padding: "1.5rem",
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${accent}30`,
            boxShadow: `0 0 30px ${accent}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
            position: "relative", overflow: "hidden",
          }}>
            {/* shimmer accent line */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }} />
            {isPerPerson(asset.pricingTiers) ? (
              <>
                <p className="admin-label" style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Users size={12} style={{ color: accent }} /> Por persona
                </p>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "1rem" }}>
                  ${Number(asset.dailyRate).toLocaleString("es-MX")} MXN / persona
                </p>

                {/* Calculador de precio */}
                <p className="admin-label" style={{ marginBottom: "0.6rem" }}>
                  Calcula tu precio
                  <span style={{ fontSize: "0.68rem", fontWeight: 400, color: "#475569", marginLeft: "0.5rem", textTransform: "none", letterSpacing: 0 }}>
                    (mínimo {minPersons} personas)
                  </span>
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <button onClick={() => setPersons((p) => Math.max(minPersons, p - 10))}
                    style={{ padding: "0.4rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>−10</button>
                  <button onClick={() => setPersons((p) => Math.max(minPersons, p - 1))}
                    style={{ padding: "0.4rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>−</button>
                  <input
                    type="number" min={1} value={persons}
                    onChange={(e) => setPersons(Math.max(minPersons, Number(e.target.value) || minPersons))}
                    style={{
                      width: 72, textAlign: "center", background: "#18181b",
                      border: `1px solid ${accent}50`, borderRadius: 8,
                      color: "#fff", fontWeight: 700, fontSize: "1rem", padding: "0.4rem 0.5rem",
                    }} />
                  <button onClick={() => setPersons((p) => p + 1)}
                    style={{ padding: "0.4rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>+</button>
                  <button onClick={() => setPersons((p) => p + 10)}
                    style={{ padding: "0.4rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}>+10</button>
                  <span style={{ fontSize: "0.78rem", color: "#475569" }}>personas</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Total estimado:</span>
                  <span style={{
                    fontSize: "2.2rem", fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1,
                    color: "var(--gold)", textShadow: "0 0 24px rgba(232,25,138,0.35)",
                  }}>
                    ${(Number(asset.dailyRate) * persons).toLocaleString("es-MX")}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#52525b", alignSelf: "flex-end", paddingBottom: "0.2rem" }}>MXN</span>
                </div>
              </>
            ) : hTiers ? (
              <>
                <p className="admin-label" style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Zap size={12} style={{ color: accent }} /> Por hora
                </p>
                {hTiers.map((t) => (
                  <div key={t.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "0.82rem", color: "#a1a1aa" }}>{t.label}</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 300, color: "var(--gold)", letterSpacing: "-0.02em" }}>
                      ${t.price.toLocaleString("es-MX")} <span style={{ fontSize: "0.55rem", color: "#52525b" }}>MXN</span>
                    </span>
                  </div>
                ))}
              </>
            ) : cTiers ? (
              <>
                <p className="admin-label" style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Users size={12} style={{ color: accent }} /> Por capacidad
                </p>
                {cTiers.map((t) => (
                  <div key={t.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "0.82rem", color: "#a1a1aa" }}>{t.label}</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 300, color: t.price > 0 ? "var(--gold)" : "#3f3f46", letterSpacing: "-0.02em" }}>
                      {t.price > 0 ? `$${t.price.toLocaleString("es-MX")} MXN` : "Por confirmar"}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", flexWrap: "wrap" }}>
                {isPromo && (
                  <span style={{ fontSize: "1rem", color: "#52525b", textDecoration: "line-through" }}>
                    ${Number(asset.originalPrice).toLocaleString("es-MX")}
                  </span>
                )}
                <span style={{
                  fontSize: "2.6rem", fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1,
                  color: isPromo ? "#f87171" : "var(--gold)",
                  textShadow: `0 0 30px ${isPromo ? "rgba(248,113,113,0.4)" : "rgba(232,25,138,0.4)"}`,
                }}>
                  ${Number(asset.dailyRate).toLocaleString("es-MX")}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#52525b", alignSelf: "flex-end", paddingBottom: "0.3rem" }}>MXN</span>
                {isPromo && (
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 700, color: "#f87171",
                    background: "rgba(220,38,38,.12)", border: "1px solid rgba(220,38,38,.3)",
                    borderRadius: 6, padding: "0.2rem 0.6rem", alignSelf: "center",
                  }}>
                    -{discount}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div style={{
              padding: "1.25rem",
              borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p className="admin-label" style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sparkles size={12} style={{ color: accent }} /> Incluye
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.85rem", color: "#d4d4d8", lineHeight: 1.55 }}>
                    <span style={{
                      color: accent, fontSize: "0.55rem", marginTop: "0.45rem", flexShrink: 0,
                      filter: `drop-shadow(0 0 4px ${accent})`,
                    }}>✦</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Componentes BOM */}
          {descLines.length > 0 && asset.componentNames.length > 0 && (
            <div style={{
              padding: "1.25rem", borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p className="admin-label" style={{ marginBottom: "0.75rem" }}>Equipo incluido</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {asset.componentNames.map((c, i) => {
                  const tagAccent = ACCENT_PALETTE[(asset.id + i) % ACCENT_PALETTE.length];
                  return (
                    <span key={i} style={{
                      fontSize: "0.72rem", color: tagAccent,
                      background: `${tagAccent}12`,
                      border: `1px solid ${tagAccent}28`,
                      borderRadius: 6, padding: "0.25rem 0.65rem",
                      fontWeight: 500,
                    }}>
                      {c}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)" }} />

          {/* Verificador de disponibilidad */}
          <div>
            <p className="admin-label" style={{ marginBottom: "0.75rem" }}>Verificar disponibilidad</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <WizardDatePicker value={date} onChange={(d) => { setDate(d); setAvail(null); }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.35rem" }}>
                  Hora inicio
                </label>
                <input type="time" value={hour} onChange={(e) => { setHour(e.target.value); setAvail(null); }}
                  className="aura-input" style={{ width: 130, colorScheme: "dark" }} />
              </div>
              <button onClick={checkAvailability} disabled={!date || checking}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.65rem 1.1rem", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600,
                  background: date ? "rgba(255,255,255,0.07)" : "transparent",
                  border: "1px solid rgba(255,255,255,0.1)", color: date ? "#e4e4e7" : "#3f3f46",
                  cursor: date ? "pointer" : "not-allowed", transition: "all 0.15s", flexShrink: 0,
                }}>
                <CalendarCheck size={14} />
                {checking ? "Verificando…" : "Verificar"}
              </button>
            </div>

            {avail !== null && date && (
              <div style={{
                marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: 10,
                background: avail ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${avail ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem",
              }}>
                <span style={{ color: avail ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: "1rem" }}>
                  {avail ? "✓" : "✕"}
                </span>
                <span style={{ color: avail ? "#86efac" : "#fca5a5" }}>
                  {avail
                    ? `Disponible el ${format(new Date(date + "T12:00:00"), "d 'de' MMMM", { locale: es })} · ${hour}h`
                    : `No disponible para el ${format(new Date(date + "T12:00:00"), "d 'de' MMMM", { locale: es })}`}
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          {avail === false ? (
            <div style={{
              textAlign: "center", padding: "0.85rem", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.07)", color: "#3f3f46", fontSize: "0.82rem",
            }}>
              No disponible para esa fecha — selecciona otra
            </div>
          ) : (
            <Link href={reserveUrl} className="btn-gold" style={{
              textAlign: "center", display: "block", borderRadius: 12, fontSize: "0.92rem",
              padding: "0.85rem",
              boxShadow: "0 0 25px rgba(232,25,138,0.35), 0 4px 15px rgba(0,0,0,0.3)",
            }}>
              {avail === true ? `✦ Reservar para el ${format(new Date(date + "T12:00:00"), "d MMM", { locale: es })}` : "✦ Cotizar este paquete"}
            </Link>
          )}

          <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#3f3f46" }}>
            Solo 30% de depósito para apartar · Sin compromiso hasta confirmar
          </p>
        </div>
      </div>

      {/* ── También te puede interesar ── */}
      {relatedProducts.length > 0 && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.25rem 4rem", position: "relative", zIndex: 1 }}>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, marginBottom: 4 }}>
                  ✦ Descubre más
                </p>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f4f4f5", margin: 0 }}>
                  También te puede interesar
                </h3>
              </div>
              <Link href="/catalogo" style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: "0.75rem", color: "#52525b", textDecoration: "none",
                transition: "color 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e4e4e7")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
              >
                Ver todo el catálogo <ChevRight size={14} />
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {relatedProducts.map((p) => {
                const img = p.imageGallery.length > 0 ? p.imageGallery[0] : p.imageUrl;
                const pAccent = ACCENT_PALETTE[p.id % ACCENT_PALETTE.length];
                return (
                  <Link key={p.id} href={`/catalogo/${p.sku.toLowerCase()}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      borderRadius: 12, overflow: "hidden",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                    }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = `${pAccent}40`;
                        el.style.transform = "translateY(-3px)";
                        el.style.boxShadow = `0 8px 24px ${pAccent}15`;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = "rgba(255,255,255,0.07)";
                        el.style.transform = "translateY(0)";
                        el.style.boxShadow = "none";
                      }}
                    >
                      {/* Imagen */}
                      <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
                        {img ? (
                          <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                        ) : (
                          <div style={{ height: "100%", background: `linear-gradient(135deg, #0c0c10, ${pAccent}18)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sparkles size={24} style={{ color: `${pAccent}40` }} />
                          </div>
                        )}
                        {/* Acento superior */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${pAccent}, transparent)` }} />
                      </div>

                      {/* Info */}
                      <div style={{ padding: "0.75rem" }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e4e4e7", marginBottom: 4, lineHeight: 1.3 }}>{p.name}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#FF3DA8" }}>
                            ${Number(p.dailyRate).toLocaleString("es-MX")}
                            <span style={{ fontSize: "0.55rem", color: "#52525b", marginLeft: 3 }}>MXN</span>
                          </span>
                          <span style={{ fontSize: "0.65rem", color: pAccent, display: "flex", alignItems: "center", gap: 2 }}>
                            Ver <ChevRight size={11} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes imageFadeIn {
          from { opacity: 0; transform: scale(1.01); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (min-width: 900px) {
          .pkg-detail-grid { grid-template-columns: 55% 45% !important; }
        }
      `}</style>
    </div>
  );
}
