"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getHourlyTiers, getCapacityTiers, getPricingTiers, getTierLabel, type PricingConfig } from "@/lib/product-tiers";
import WizardDatePicker from "./WizardDatePicker";
import UpsellBanner from "./UpsellBanner";

interface AssetAvail  { assetId: number; isAvailable: boolean; availableUnits: number }
interface AssetDetail {
  id: number; name: string; dailyRate: string; sku: string;
  maxGuests: number | null; category: { id: number; name: string }; description: string | null;
  pricingTiers?: PricingConfig | null;
  originalPrice?: string | null;
  isRecommended?: boolean;
  promoType?: string | null;
  promoMinValue?: number | null;
}
interface SelectedItem { assetId: number; assetName: string; quantity: number; max: number; overridePrice?: number }
interface PkgInfo     {
  id: number; name: string; dailyRate: string; sku: string;
  maxGuests: number | null; category?: { name: string };
  pricingTiers?: PricingConfig | null;
  hasSound?: boolean;
}

function pkgHasSoundFromComponents(components: { childAsset?: { name?: string } }[]): boolean {
  return components.some((c) => /dj|audio|sonido/i.test(c.childAsset?.name ?? ""));
}

// Zona de cobertura sin cargo extra
const ZONE_KEYWORDS = ["zacatecas", "guadalupe", "zacatecas-guadalupe", "capital"];

function isOutOfZone(address: string) {
  if (!address.trim()) return false;
  const lower = address.toLowerCase();
  return !ZONE_KEYWORDS.some((kw) => lower.includes(kw));
}

// Categorías de servicios individuales (NO paquetes completos)
const SERVICE_CATS = ["Sonido", "Iluminación", "Entretenimiento", "Fotografía", "Staff", "Mobiliario", "Cabinas"];
const CAT_ICON: Record<string, string> = {
  "Sonido": "🔊", "Iluminación": "💡", "Entretenimiento": "🎭",
  "Fotografía": "📷", "Staff": "👤", "Mobiliario": "🪑", "Cabinas": "📸",
};

const STEPS_PKG    = ["Tus datos", "Fecha y hora", "Complementos", "Confirmar"];
const STEPS_NO_PKG = ["Tus datos", "Fecha y hora", "Elige paquete", "Confirmar"];

const EVENT_ICONS: Record<string, string> = {
  "Boda": "💍", "XV Años": "👑", "Quinceañera": "👑",
  "Cumpleaños": "🎂", "Cumpleaños VIP": "🎂",
  "Corporativo": "💼", "Graduación": "🎓",
  "Bautizo": "👶", "Baby Shower": "🍼",
  "Aniversario": "💑", "Fiesta": "🎊",
};

export default function BookingWizard({ forcedAssetId }: { forcedAssetId?: number | null } = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const prevForcedId = useRef<number | null | undefined>(undefined);

  const [step,      setStep]      = useState(0);
  const [stepDir,   setStepDir]   = useState<"forward" | "back">("forward");
  const goStep = (n: number) => { setStepDir(n > step ? "forward" : "back"); setStep(n); };
  const [client,    setClient]    = useState({ fullName: "", phone: "", email: "" });
  const [guests,    setGuests]    = useState<number | "">("");
  const [eventDate, setEventDate] = useState("");
  const [setupHour, setSetupHour] = useState("19:00");
  const [eventName, setEventName] = useState("");
  const [venue,     setVenue]     = useState("");

  const [preselectedPkg,  setPreselectedPkg]  = useState<PkgInfo | null>(null);
  const [allProducts,     setAllProducts]     = useState<AssetDetail[]>([]);
  const [availability,    setAvailability]    = useState<Record<number, AssetAvail>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selected,        setSelected]        = useState<SelectedItem[]>([]);

  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");
  const [prefillError,  setPrefillError]  = useState("");

  // hora fin = inicio + 6h
  const teardownHour = (() => {
    const [h, m] = setupHour.split(":").map(Number);
    return `${String((h + 6) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  })();

  // ── Pre-fill desde URL ────────────────────────────────────────────────────
  // Solo corre cuando NO hay forcedAssetId (para evitar carga doble)
  useEffect(() => {
    const sh = params.get("sh"), start = params.get("start"), assetId = params.get("asset");
    if (sh)    setSetupHour(sh);
    if (start) setEventDate(start.split("T")[0]);
    // Si forcedAssetId maneja el paquete, no duplicar la carga desde URL
    if (assetId && forcedAssetId == null) {
      fetch(`/api/assets/${assetId}`)
        .then((r) => r.json())
        .then((json) => {
          if (!json.data) return; // asset no encontrado: ignorar silenciosamente
          const pkg: PkgInfo = {
            id: json.data.id, name: json.data.name,
            dailyRate: String(json.data.dailyRate), sku: json.data.sku,
            maxGuests: json.data.maxGuests ?? null, category: json.data.category,
            pricingTiers: json.data.pricingTiers ?? null,
            hasSound: pkgHasSoundFromComponents(json.data.components ?? []),
          };
          setPreselectedPkg(pkg);
          const isSpecial = !!getPricingTiers(json.data.sku, json.data.pricingTiers);
          if (!isSpecial) {
            setSelected([{ assetId: pkg.id, assetName: pkg.name, quantity: 1, max: 1 }]);
          }
        })
        .catch(() => {}); // fallo silencioso — wizard abre vacío
    }
  }, [params, forcedAssetId]);

  // ── forcedAssetId: cuando el comparador selecciona un paquete ────────────
  useEffect(() => {
    // Solo actuar cuando cambia a un valor distinto (evita dispararse en el mount inicial)
    if (forcedAssetId === prevForcedId.current) return;
    prevForcedId.current = forcedAssetId;
    if (forcedAssetId == null) return;

    setPreselectedPkg(null);
    setSelected([]);
    setStep(0);
    setPrefillError("");

    fetch(`/api/assets/${forcedAssetId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) return; // asset no encontrado o inactivo: wizard abre vacío
        const d = json.data;
        const pkg: PkgInfo = {
          id: d.id, name: d.name, dailyRate: String(d.dailyRate), sku: d.sku,
          maxGuests: d.maxGuests ?? null, category: d.category,
          pricingTiers: d.pricingTiers ?? null,
          hasSound: pkgHasSoundFromComponents(d.components ?? []),
        };
        setPreselectedPkg(pkg);
        const isSpecial = !!getPricingTiers(d.sku, d.pricingTiers);
        if (!isSpecial) setSelected([{ assetId: pkg.id, assetName: pkg.name, quantity: 1, max: 1 }]);
      })
      .catch(() => {}); // fallo silencioso
  }, [forcedAssetId]);

  // ── Cargar complementos ───────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    if (!eventDate) return;
    setLoadingProducts(true);
    const start = new Date(`${eventDate}T${setupHour}:00`);
    const end   = new Date(`${eventDate}T${teardownHour}:00`);
    if (end <= start) end.setDate(end.getDate() + 1);
    const [pr, ar] = await Promise.all([
      fetch("/api/assets?rentable=true"),
      fetch(`/api/availability?start=${start.toISOString()}&end=${end.toISOString()}`),
    ]);
    const [pj, aj] = await Promise.all([pr.json(), ar.json()]);
    setAllProducts(pj.data ?? []);
    const map: Record<number, AssetAvail> = {};
    for (const a of aj.data ?? []) map[a.assetId] = a;
    setAvailability(map);
    setLoadingProducts(false);
  }, [eventDate, setupHour, teardownHour]);

  useEffect(() => { if (step === 2 && eventDate) loadProducts(); }, [step, eventDate, loadProducts]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggle = (p: AssetDetail) => {
    if (preselectedPkg && p.id === preselectedPkg.id) return;
    setSelected((prev) => {
      const exists = prev.find((s) => s.assetId === p.id);
      if (exists) return prev.filter((s) => s.assetId !== p.id);
      return [...prev, { assetId: p.id, assetName: p.name, quantity: 1, max: availability[p.id]?.availableUnits ?? 1 }];
    });
  };

  const updateQty = (assetId: number, qty: number) => {
    if (preselectedPkg && assetId === preselectedPkg.id) return;
    setSelected((prev) => prev.map((s) => s.assetId === assetId ? { ...s, quantity: Math.max(1, Math.min(qty, s.max)) } : s));
  };

  // ── Alerta de capacidad ───────────────────────────────────────────────────
  const guestNum     = Number(guests) || 0;
  const pkgCapacity  = preselectedPkg?.maxGuests ?? null;
  const capacityWarn = pkgCapacity !== null && guestNum > 0 && guestNum > pkgCapacity;

  // Mejor recomendación: paquete más barato que supere la capacidad
  const recommendation = (() => {
    if (!capacityWarn) return null;
    return allProducts
      .filter((p) => SERVICE_CATS.indexOf(p.category?.name ?? "") === -1) // solo paquetes
      .filter((p) => (p.maxGuests ?? 0) >= guestNum && p.id !== preselectedPkg?.id)
      .sort((a, b) => Number(a.dailyRate) - Number(b.dailyRate))[0] ?? null;
  })();

  // Complementos: categorías de servicio + recomendados, excluir paquete principal
  const extras = allProducts.filter((p) => {
    if (preselectedPkg && p.id === preselectedPkg.id) return false;
    if (!availability[p.id]?.isAvailable) return false;
    if (SERVICE_CATS.includes(p.category?.name ?? "")) return true;
    // Recomendados fuera de SERVICE_CATS: mostrar si condición cumplida
    if (p.isRecommended) {
      if (p.promoType === "guests" && p.promoMinValue != null) return guestNum >= p.promoMinValue;
      return true; // "fixed" u "hours" siempre visible
    }
    return false;
  });

  const grouped = extras.reduce<Record<string, AssetDetail[]>>((acc, p) => {
    const cat = p.category?.name ?? "Otros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  // ── Envío ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true); setError("");
    const start = new Date(`${eventDate}T${setupHour}:00`);
    const end   = new Date(`${eventDate}T${teardownHour}:00`);
    if (end <= start) end.setDate(end.getDate() + 1);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { ...client, notes: guests ? `Invitados: ${guests}` : undefined },
          eventName: eventName || `Evento de ${client.fullName}`,
          eventDate: start.toISOString(), setupAt: start.toISOString(), teardownAt: end.toISOString(),
          venueAddress: venue,
          items: selected.map((s) => ({ assetId: s.assetId, quantity: s.quantity, overridePrice: s.overridePrice })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push(`/reserva/${json.data.booking.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al procesar la reserva");
      setSubmitting(false);
    }
  };

  // Si el producto pre-seleccionado es de tipo tier (hora/capacidad),
  // el usuario debe elegir el tier antes de avanzar
  const pkgNeedsTier = preselectedPkg && !!getPricingTiers(preselectedPkg.sku, preselectedPkg.pricingTiers);
  const tierOk       = !pkgNeedsTier || !!selected.find((s) => s.assetId === preselectedPkg?.id);
  const canNext0 = client.fullName.trim().length >= 2 && client.phone.trim().length >= 8 && !!guests && Number(guests) > 0 && tierOk;
  const canNext1 = !!eventDate;
  const canNext2 = preselectedPkg ? true : selected.length > 0;
  const STEPS    = preselectedPkg ? STEPS_PKG : STEPS_NO_PKG;

  // ── Cálculo del total ─────────────────────────────────────────────────────
  const total = selected.reduce((sum, s) => {
    const price = s.overridePrice != null
      ? s.overridePrice
      : Number(allProducts.find((p) => p.id === s.assetId)?.dailyRate ?? 0);
    return sum + price * s.quantity;
  }, 0);

  const outOfZone  = isOutOfZone(venue);
  const hasSoundPkg = preselectedPkg?.hasSound === true ||
    selected.some((s) => allProducts.find((p) => p.id === s.assetId)?.category?.name === "Sonido");
  const eventIcon  = EVENT_ICONS[eventName ?? ""] ?? "🎉";
  const muted    = { color: "#71717a" } as React.CSSProperties;
  const gold     = { color: "#FF3DA8" } as React.CSSProperties;
  const lb       = "block text-xs font-semibold uppercase tracking-widest mb-2";
  // Input con focus gold — aplicado inline para no depender de clase global
  const inputStyle: React.CSSProperties = {
    background: "#18181b",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    color: "var(--cream)",
    fontSize: "1rem",          // ≥16px → evita zoom en iOS
    width: "100%",
    outline: "none",
    fontFamily: "var(--font-dm)",
    minHeight: 48,             // touch target mínimo
    transition: "border-color 0.2s",
  };
  const dl       = eventDate ? format(new Date(eventDate + "T12:00:00"), "EEEE d 'de' MMMM yyyy", { locale: es }) : "";

  return (
    <div>
      {/* STEPPER — con barra de progreso animada */}
      <div style={{ marginBottom: "2rem" }}>
        {/* Barra superior */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, marginBottom: "1.25rem", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${(step / (STEPS.length - 1)) * 100}%`,
            background: "linear-gradient(90deg, var(--gold), var(--gold2))",
            borderRadius: 1,
            transition: "width 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
          }} />
        </div>
        {/* Círculos + líneas conectoras */}
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: i < STEPS.length - 1 ? 1 : 0, display: "flex", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 700,
                  background: i < step ? "rgba(22,163,74,0.15)" : i === step ? "var(--gold)" : "rgba(255,255,255,0.05)",
                  color:      i < step ? "#4ade80"             : i === step ? "#05051a"      : "#52525b",
                  border:     `1.5px solid ${i < step ? "rgba(22,163,74,0.3)" : i === step ? "var(--gold)" : "rgba(255,255,255,0.08)"}`,
                  transition: "all 0.25s",
                  boxShadow:  i === step ? "0 0 12px rgba(232,25,138,0.3)" : "none",
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 600, whiteSpace: "nowrap",
                  color: i === step ? "#e4e4e7" : i < step ? "#4ade80" : "#3f3f46",
                  transition: "color 0.25s",
                }}>{s}</span>
              </div>
              {/* Línea conectora con fill animado */}
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, position: "relative", height: 2, margin: "0.9rem 0.35rem 0", flexShrink: 1 }}>
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)", borderRadius: 1 }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "var(--gold)",
                    borderRadius: 1,
                    transform: `scaleX(${i < step ? 1 : 0})`,
                    transformOrigin: "left",
                    transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wrapper animado — key={step} fuerza remount y re-dispara la animación */}
      <div key={step} className={stepDir === "forward" ? "wizard-slide-in" : "wizard-slide-back"}>

      {/* ══ PASO 0: DATOS ══ */}
      {step === 0 && (
        <div className="aura-card p-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#52525b" }}>Tus datos</p>
          {prefillError && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", color: "#fde68a" }} role="alert">
              ⚠️ {prefillError}
            </div>
          )}
          {preselectedPkg && (() => {
            const hTiers  = getHourlyTiers(preselectedPkg.sku, preselectedPkg.pricingTiers);
            const cTiers  = getCapacityTiers(preselectedPkg.sku, preselectedPkg.pricingTiers);
            const pkgSel  = selected.find((s) => s.assetId === preselectedPkg.id);

            if (hTiers) {
              // ── Cabina fotográfica: selector de horas ──────────────────────
              return (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.3)" }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9333EA" }}>✦ Servicio seleccionado</p>
                    <p className="font-black text-white">{preselectedPkg.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
                      ¿Cuántas horas necesitas? <span style={{ color: "#EF4444" }}>*</span>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                      {hTiers.map((tier) => {
                        const active = pkgSel?.overridePrice === tier.price;
                        return (
                          <button key={tier.label}
                            type="button"
                            onClick={() => setSelected([{ assetId: preselectedPkg.id, assetName: preselectedPkg.name, quantity: 1, max: 1, overridePrice: tier.price }])}
                            style={{
                              padding: "0.6rem 1.1rem",
                              borderRadius: 10,
                              border: `2px solid ${active ? "#7C3AED" : "rgba(124,58,237,.3)"}`,
                              background: active ? "rgba(124,58,237,.35)" : "rgba(124,58,237,.08)",
                              color: active ? "#fff" : "#94a3b8",
                              fontWeight: 700, fontSize: "0.85rem",
                              cursor: "pointer", transition: "all 0.15s",
                              textAlign: "center" as const,
                            }}>
                            <span style={{ display: "block", fontSize: "1rem", color: active ? "#fff" : "var(--cream)" }}>{tier.label}</span>
                            <span style={{ display: "block", fontSize: "0.78rem", color: active ? "#FF3DA8" : "#64748b", marginTop: "0.1rem" }}>
                              ${tier.price.toLocaleString("es-MX")} MXN
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {!pkgSel && (
                      <p className="text-xs mt-2" style={{ color: "#EF4444" }}>Selecciona una opción para continuar</p>
                    )}
                    {pkgSel?.overridePrice && (
                      <p className="text-sm font-black mt-2" style={gold}>
                        Total: ${pkgSel.overridePrice.toLocaleString("es-MX")} MXN
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            if (cTiers) {
              // ── Maruchan: selector de capacidad ───────────────────────────
              return (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.3)" }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9333EA" }}>✦ Servicio seleccionado</p>
                    <p className="font-black text-white">{preselectedPkg.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
                      ¿Para cuántas personas? <span style={{ color: "#EF4444" }}>*</span>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                      {cTiers.map((opt) => {
                        const active = pkgSel?.overridePrice === opt.price;
                        const price  = opt.price;
                        return (
                          <button key={opt.label}
                            type="button"
                            onClick={() => setSelected([{ assetId: preselectedPkg.id, assetName: preselectedPkg.name, quantity: 1, max: 1, overridePrice: opt.price }])}
                            style={{
                              padding: "0.6rem 1.1rem",
                              borderRadius: 10,
                              border: `2px solid ${active ? "#7C3AED" : "rgba(124,58,237,.3)"}`,
                              background: active ? "rgba(124,58,237,.35)" : "rgba(124,58,237,.08)",
                              color: active ? "#fff" : "#94a3b8",
                              fontWeight: 700, fontSize: "0.85rem",
                              cursor: "pointer", transition: "all 0.15s",
                              textAlign: "center" as const,
                            }}>
                            <span style={{ display: "block", fontSize: "1rem", color: active ? "#fff" : "var(--cream)" }}>{opt.label}</span>
                            <span style={{ display: "block", fontSize: "0.78rem", color: active ? "#FF3DA8" : "#64748b", marginTop: "0.1rem" }}>
                              ${price.toLocaleString("es-MX")} MXN
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {!pkgSel && (
                      <p className="text-xs mt-2" style={{ color: "#EF4444" }}>Selecciona una opción para continuar</p>
                    )}
                    {pkgSel?.overridePrice && (
                      <p className="text-sm font-black mt-2" style={gold}>
                        Total: ${pkgSel.overridePrice.toLocaleString("es-MX")} MXN
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // ── Paquete regular ────────────────────────────────────────────
            return (
              <div className="rounded-xl p-4" style={{ background: "rgba(124,58,237,.12)", border: "2px solid #7C3AED" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9333EA" }}>✦ Paquete seleccionado</p>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-black text-white text-base">{preselectedPkg.name}</p>
                    {preselectedPkg.maxGuests && (
                      <p className="text-xs mt-0.5" style={{ color: "#9333EA" }}>👥 hasta {preselectedPkg.maxGuests} invitados</p>
                    )}
                  </div>
                  <p className="text-lg font-black flex-shrink-0" style={gold}>
                    ${Number(preselectedPkg.dailyRate).toLocaleString("es-MX")} MXN
                  </p>
                </div>
              </div>
            );
          })()}

          <div>
            <label className={lb} style={muted}>Nombre completo *</label>
            <input value={client.fullName} onChange={(e) => setClient((c) => ({ ...c, fullName: e.target.value }))}
              placeholder="Juan García López" className="aura-input" autoComplete="name" />
          </div>
          <div>
            <label className={lb} style={muted}>Teléfono *</label>
            <input type="tel" value={client.phone} onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))}
              placeholder="492 123 4567" className="aura-input" autoComplete="tel" />
          </div>
          <div>
            <label className={lb} style={muted}>
              Correo electrónico <span className="normal-case font-normal ml-1" style={{ color: "#475569" }}>(opcional)</span>
            </label>
            <input type="email" value={client.email} onChange={(e) => setClient((c) => ({ ...c, email: e.target.value }))}
              placeholder="juan@correo.com" className="aura-input" />
          </div>

          {/* Número de invitados */}
          <div>
            <label className={lb} style={muted}>Número de invitados *</label>
            <input type="number" min={1} max={2000}
              value={guests}
              onChange={(e) => setGuests(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Ej: 150" className="aura-input" style={{ maxWidth: 180 }} />
            {/* Alerta inmediata de capacidad */}
            {capacityWarn && (
              <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "#fca5a5" }}>
                <p className="font-bold">⚠️ Capacidad insuficiente</p>
                <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                  El paquete <strong className="text-white">{preselectedPkg?.name}</strong> está diseñado para <strong className="text-white">hasta {pkgCapacity} invitados</strong>. Tu evento tiene <strong className="text-white">{guestNum}</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={() => router.back()} className="text-sm font-bold" style={muted}>← Volver</button>
            <button onClick={() => goStep(1)} disabled={!canNext0} className="btn-gold disabled:opacity-40 px-8 py-3 text-sm">
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ══ PASO 1: FECHA ══ */}
      {step === 1 && (
        <div className="aura-card p-6 space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={gold}>📅 ¿Cuándo es tu evento?</p>
          <div>
            <label className={lb} style={muted}>Fecha del evento *</label>
            <WizardDatePicker value={eventDate} onChange={setEventDate} />
          </div>
          <div>
            <label className={lb} style={muted}>Hora de inicio</label>
            <input type="time" value={setupHour} onChange={(e) => setSetupHour(e.target.value)}
              className="aura-input" style={{ colorScheme: "dark", maxWidth: 160 }} />
          </div>
          <div>
            <label className={lb} style={muted}>Tipo de evento <span className="normal-case font-normal ml-1" style={{ color: "#475569" }}>(opcional)</span></label>
            <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Boda, Quinceañera, Cumpleaños..." className="aura-input" />
          </div>
          <div>
            <label className={lb} style={muted}>Dirección <span className="normal-case font-normal ml-1" style={{ color: "#475569" }}>(opcional)</span></label>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Salón, calle, colonia, ciudad..." className="aura-input" />
            {/* Aviso traslado */}
            {outOfZone && (
              <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", color: "#fde68a" }}>
                🚗 <strong>Aviso de traslado:</strong> Tu evento parece estar fuera de la zona Zacatecas–Guadalupe. Los costos podrían aumentar por gastos de traslado. Te confirmaremos el costo adicional al contactarte.
              </div>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => goStep(0)} className="text-sm font-bold" style={muted}>← Atrás</button>
            <button onClick={() => goStep(2)} disabled={!canNext1} className="btn-gold disabled:opacity-40 px-8 py-3 text-sm">
              {preselectedPkg ? "Ver complementos →" : "Ver paquetes →"}
            </button>
          </div>
        </div>
      )}

      {/* ══ PASO 2-A: COMPLEMENTOS ══ */}
      {step === 2 && preselectedPkg && (
        <div className="space-y-4">

          {/* Alerta de capacidad + recomendación */}
          {capacityWarn && (
            <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.35)" }}>
              <p className="font-black text-sm" style={{ color: "#fca5a5" }}>
                ⚠️ Este paquete es para hasta {pkgCapacity} invitados, pero tu evento tiene {guestNum}
              </p>
              <p className="text-xs mt-1" style={muted}>
                El audio y la cobertura podrían no ser suficientes para todos tus invitados.
              </p>
              {recommendation && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(239,68,68,.25)" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#fbbf24" }}>💡 Te recomendamos:</p>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-white font-bold text-sm">{recommendation.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                        Cubre hasta <strong className="text-white">{recommendation.maxGuests} invitados</strong>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black" style={gold}>${Number(recommendation.dailyRate).toLocaleString("es-MX")}</p>
                      <a href={`/reservar?asset=${recommendation.id}`}
                        className="text-xs font-bold underline" style={{ color: "#7C3AED" }}>
                        Cotizar este →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paquete principal */}
          <div className="rounded-xl p-4" style={{ background: "rgba(124,58,237,.12)", border: "2px solid #7C3AED" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9333EA" }}>✦ Tu paquete</p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-white">{preselectedPkg.name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <p className="text-sm font-black" style={gold}>${Number(preselectedPkg.dailyRate).toLocaleString("es-MX")} MXN</p>
                  {preselectedPkg.maxGuests && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,.2)", color: "#c084fc" }}>
                      👥 hasta {preselectedPkg.maxGuests} personas
                    </span>
                  )}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black" style={{ background: "#7C3AED" }}>✓</div>
            </div>
          </div>

          {/* UpsellBanner — reglas configuradas en /admin/upsell */}
          {!loadingProducts && (
            <UpsellBanner
              selectedAssetIds={selected.map((s) => s.assetId)}
              addedIds={[
                ...selected.map((s) => s.assetId),
                // ocultar también los que ya se muestran en la sección Recomendados
                ...extras.filter((p) => p.isRecommended).map((p) => p.id),
              ]}
              onAdd={(assetId, name, price) => {
                setSelected((prev) => [
                  ...prev,
                  {
                    assetId,
                    assetName: name,
                    quantity: 1,
                    max: availability[assetId]?.availableUnits ?? 1,
                    overridePrice: price > 0 ? price : undefined,
                  },
                ]);
              }}
            />
          )}

          {/* Complementos por categoría */}
          <div className="aura-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={gold}>➕ Agrega complementos</p>
            <p className="text-sm mb-4" style={muted}>Servicios adicionales que puedes sumar. Todos opcionales.</p>

            {loadingProducts && <p className="text-sm text-center py-6" style={muted}>Cargando disponibilidad...</p>}
            {!loadingProducts && Object.keys(grouped).length === 0 && (
              <p className="text-sm text-center py-6" style={muted}>No hay complementos disponibles para esta fecha.</p>
            )}

            {/* Recomendados destacados */}
            {!loadingProducts && extras.filter((p) => p.isRecommended).map((p) => {
              const sel = selected.find((s) => s.assetId === p.id);
              const promoLabel = p.promoType === "guests" ? `Para ${p.promoMinValue}+ invitados` : p.promoType === "hours" ? `${p.promoMinValue} hrs incluidas` : "Promoción especial";
              return (
                <div key={`rec-${p.id}`}
                  onClick={() => {
                    if (sel) setSelected((prev) => prev.filter((s) => s.assetId !== p.id));
                    else setSelected((prev) => [...prev, { assetId: p.id, assetName: p.name, quantity: 1, max: availability[p.id]?.availableUnits ?? 1 }]);
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-3"
                  style={{ borderColor: sel ? "var(--gold)" : "rgba(212,175,55,.4)", background: sel ? "rgba(212,175,55,.08)" : "rgba(212,175,55,.03)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,.2)", color: "var(--gold)" }}>⭐ Recomendado</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,.1)", color: "#94A3B8" }}>{promoLabel}</span>
                    </div>
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    {p.description && <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{p.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.originalPrice && Number(p.originalPrice) > Number(p.dailyRate) && (
                      <p className="text-xs line-through" style={{ color: "#6b7280" }}>${Number(p.originalPrice).toLocaleString("es-MX")}</p>
                    )}
                    <p className="text-sm font-black" style={{ color: "var(--gold)" }}>${Number(p.dailyRate).toLocaleString("es-MX")}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{ borderColor: sel ? "var(--gold)" : "#334155", background: sel ? "var(--gold)" : "transparent", color: sel ? "#05051a" : "transparent" }}>✓</div>
                </div>
              );
            })}

            {!loadingProducts && Object.entries(grouped).map(([cat, products]) => (
              <div key={cat} className="mb-5">
                <p className="text-xs font-black uppercase tracking-widest mb-2"
                  style={{ color: "#475569", borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: "0.4rem" }}>
                  {CAT_ICON[cat] ?? "✦"} {cat}
                </p>
                <div className="space-y-2">
                  {products.map((p) => {
                    const sel           = selected.find((s) => s.assetId === p.id);
                    const hourlyTiers   = getHourlyTiers(p.sku, p.pricingTiers);
                    const capacityTiers = getCapacityTiers(p.sku, p.pricingTiers);
                    const isSpecial     = !!(hourlyTiers || capacityTiers);
                    const exceedsCapacity = !capacityTiers && p.maxGuests !== null && guestNum > 0 && guestNum > (p.maxGuests ?? Infinity);

                    const handleTierClick = (overridePrice?: number, qty?: number) => {
                      const exists = selected.find((s) => s.assetId === p.id);
                      const isSame = overridePrice !== undefined
                        ? exists?.overridePrice === overridePrice
                        : exists?.quantity === qty;

                      if (!exists) {
                        setSelected((prev) => [...prev, {
                          assetId: p.id, assetName: p.name,
                          quantity: qty ?? 1,
                          max: availability[p.id]?.availableUnits ?? 4,
                          ...(overridePrice !== undefined && { overridePrice }),
                        }]);
                      } else if (isSame) {
                        setSelected((prev) => prev.filter((s) => s.assetId !== p.id));
                      } else {
                        setSelected((prev) => prev.map((s) => s.assetId === p.id
                          ? { ...s, ...(qty !== undefined && { quantity: qty }), ...(overridePrice !== undefined && { overridePrice }) }
                          : s));
                      }
                    };

                    const handleCardClick = () => {
                      if (!isSpecial) { toggle(p); return; }
                      // Para productos con tiers: click en la card activa con el primer tier,
                      // o deselecciona si ya estaba seleccionado
                      const exists = selected.find((s) => s.assetId === p.id);
                      if (exists) {
                        setSelected((prev) => prev.filter((s) => s.assetId !== p.id));
                      } else if (hourlyTiers) {
                        setSelected((prev) => [...prev, { assetId: p.id, assetName: p.name, quantity: 1, max: 1, overridePrice: hourlyTiers[0].price }]);
                      } else if (capacityTiers) {
                        setSelected((prev) => [...prev, { assetId: p.id, assetName: p.name, quantity: 1, max: 1, overridePrice: capacityTiers[0].price }]);
                      }
                    };

                    return (
                      <div key={p.id}
                        onClick={handleCardClick}
                        className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                        style={{ borderColor: sel ? "#7C3AED" : "rgba(124,58,237,.2)", background: sel ? "rgba(124,58,237,.08)" : "rgba(255,255,255,.02)" }}>

                        {/* Checkbox */}
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ borderColor: sel ? "#7C3AED" : "#334155", background: sel ? "#7C3AED" : "transparent", color: "#fff", fontSize: "0.65rem" }}>
                          {sel ? "✓" : ""}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm leading-tight">{p.name}</p>
                          {/* Hint cuando no está seleccionado */}
                          {isSpecial && !sel && (
                            <p style={{ fontSize: "0.68rem", color: "#475569", marginTop: "0.2rem" }}>
                              {hourlyTiers ? "Toca para elegir horario" : "Toca para elegir capacidad"}
                            </p>
                          )}
                          {exceedsCapacity && (
                            <span className="text-xs" style={{ color: "#f87171" }}>
                              ⚠️ Hasta {p.maxGuests} px (insuficiente)
                            </span>
                          )}

                          {/* Selector de horas — Cabina fotográfica (solo cuando está seleccionada) */}
                          {hourlyTiers && sel && (
                            <div style={{ marginTop: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                              <p style={{ fontSize: "0.68rem", color: "#475569", marginBottom: "0.35rem" }}>Renta por hora:</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                {hourlyTiers.map((tier) => {
                                  const active = sel?.overridePrice === tier.price;
                                  return (
                                    <button key={tier.label}
                                      onClick={() => handleTierClick(tier.price, undefined)}
                                      style={{
                                        background: active ? "rgba(124,58,237,.45)" : "rgba(124,58,237,.1)",
                                        border: `1px solid ${active ? "#7C3AED" : "rgba(124,58,237,.3)"}`,
                                        borderRadius: 999, padding: "0.25rem 0.7rem",
                                        fontSize: "0.72rem", fontWeight: 700,
                                        color: active ? "#fff" : "#94a3b8", cursor: "pointer",
                                        transition: "all 0.15s",
                                      }}>
                                      {tier.label} · ${tier.price.toLocaleString("es-MX")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Selector de capacidad — Maruchan (solo cuando está seleccionado) */}
                          {capacityTiers && sel && (
                            <div style={{ marginTop: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                              <p style={{ fontSize: "0.68rem", color: "#475569", marginBottom: "0.35rem" }}>Número de personas:</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                {capacityTiers.map((opt) => {
                                  const active = sel?.overridePrice === opt.price;
                                  return (
                                    <button key={opt.label}
                                      onClick={() => handleTierClick(opt.price, undefined)}
                                      style={{
                                        background: active ? "rgba(124,58,237,.45)" : "rgba(124,58,237,.1)",
                                        border: `1px solid ${active ? "#7C3AED" : "rgba(124,58,237,.3)"}`,
                                        borderRadius: 999, padding: "0.25rem 0.7rem",
                                        fontSize: "0.72rem", fontWeight: 700,
                                        color: active ? "#fff" : "#94a3b8", cursor: "pointer",
                                        transition: "all 0.15s",
                                      }}>
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Precio */}
                        <div className="flex-shrink-0 text-right">
                          {hourlyTiers ? (
                            sel?.overridePrice
                              ? <p className="text-sm font-black" style={gold}>+${sel.overridePrice.toLocaleString("es-MX")}</p>
                              : <p style={{ fontSize: "0.7rem", color: "#475569" }}>Desde $2,000</p>
                          ) : capacityTiers ? (
                            sel?.overridePrice
                              ? <p className="text-sm font-black" style={gold}>+${sel.overridePrice.toLocaleString("es-MX")}</p>
                              : <p style={{ fontSize: "0.7rem", color: "#475569" }}>Desde ${(capacityTiers[0]?.price ?? 0).toLocaleString("es-MX")}</p>
                          ) : (
                            <>
                              {Number(p.dailyRate) > 0 && (
                                <p className="text-sm font-black" style={gold}>+${Number(p.dailyRate).toLocaleString("es-MX")}</p>
                              )}
                              {sel && (availability[p.id]?.availableUnits ?? 1) > 1 && (
                                <div className="flex items-center gap-1 mt-1 justify-end" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => updateQty(p.id, sel.quantity - 1)}
                                    className="w-6 h-6 rounded font-black text-white text-xs" style={{ background: "rgba(124,58,237,.4)" }}>−</button>
                                  <span className="text-white font-black text-xs w-4 text-center">{sel.quantity}</span>
                                  <button onClick={() => updateQty(p.id, sel.quantity + 1)}
                                    className="w-6 h-6 rounded font-black text-white text-xs" style={{ background: "rgba(124,58,237,.4)" }}>+</button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Total en tiempo real */}
          {total > 0 && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(232,25,138,.08)", border: "1px solid rgba(232,25,138,.2)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Total estimado</p>
                <p className="text-xl font-black" style={gold}>${total.toLocaleString("es-MX")} MXN</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "#475569" }}>{selected.length} servicio{selected.length !== 1 ? "s" : ""}</p>
                {outOfZone && <p className="text-xs font-bold" style={{ color: "#fde68a" }}>+ traslado*</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => goStep(1)} className="text-sm font-bold" style={muted}>← Atrás</button>
            <button onClick={() => goStep(3)} className="btn-gold px-8 py-3 text-sm">
              {selected.length > 1 ? `Continuar (${selected.length - 1} extra${selected.length > 2 ? "s" : ""}) →` : "Continuar sin extras →"}
            </button>
          </div>
        </div>
      )}

      {/* ══ PASO 2-B: SIN PRE-SELECCIÓN ══ */}
      {step === 2 && !preselectedPkg && (
        <div className="space-y-4">
          {dl && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
              style={{ background: "rgba(212,175,55,.08)", border: "1px solid rgba(212,175,55,.2)" }}>
              <span style={gold}>📅</span>
              <span style={muted}>{dl} · {setupHour}h · {guestNum > 0 ? `${guestNum} invitados` : ""}</span>
              <button onClick={() => goStep(1)} className="ml-auto text-xs font-bold" style={gold}>Cambiar</button>
            </div>
          )}
          <div className="aura-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={gold}>🎉 Elige tu paquete</p>
            {loadingProducts && <p className="text-sm text-center py-6" style={muted}>Cargando...</p>}
            {!loadingProducts && allProducts
              .filter((p) => !SERVICE_CATS.includes(p.category?.name ?? "") && availability[p.id]?.isAvailable)
              .map((p) => {
                const sel = selected.find((s) => s.assetId === p.id);
                const insufficiente = p.maxGuests !== null && guestNum > 0 && guestNum > (p.maxGuests ?? 0);
                return (
                  <div key={p.id} onClick={() => toggle(p)}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-2"
                    style={{ borderColor: sel ? "#7C3AED" : "rgba(124,58,237,.2)", background: sel ? "rgba(124,58,237,.1)" : "rgba(255,255,255,.02)" }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">{p.name}</p>
                        {insufficiente && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,.15)", color: "#fca5a5" }}>⚠️ Capacidad insuficiente</span>}
                      </div>
                      {p.maxGuests && <p className="text-xs mt-0.5" style={{ color: insufficiente ? "#f87171" : "#475569" }}>👥 hasta {p.maxGuests} personas</p>}
                    </div>
                    {Number(p.dailyRate) > 0 && <p className="text-sm font-black flex-shrink-0" style={gold}>${Number(p.dailyRate).toLocaleString("es-MX")}</p>}
                    <span className="text-xl flex-shrink-0" style={{ color: sel ? "#FF3DA8" : "transparent" }}>✓</span>
                  </div>
                );
              })}
          </div>
          <div className="flex justify-between">
            <button onClick={() => goStep(1)} className="text-sm font-bold" style={muted}>← Atrás</button>
            <button onClick={() => goStep(3)} disabled={!canNext2} className="btn-gold disabled:opacity-40 px-8 py-3 text-sm">Revisar →</button>
          </div>
        </div>
      )}

      {/* ══ PASO 3: CONFIRMAR ══ */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* ── TICKET ───────────────────────────── */}
          <div style={{
            borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(232,25,138,.25)",
            boxShadow: "0 0 40px rgba(232,25,138,.1), 0 2px 40px rgba(0,0,0,.4)",
          }}>
            {/* Cabecera del ticket */}
            <div style={{
              background: "linear-gradient(135deg, #130033 0%, #0d0d2b 55%, #1a000d 100%)",
              padding: "1.5rem", position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(232,25,138,.18) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: "rgba(232,25,138,.15)", border: "1px solid rgba(232,25,138,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
                }}>
                  {eventIcon}
                </div>
                <div>
                  <p style={{ color: "var(--gold)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Reserva VIP · Daysu.vip</p>
                  <p style={{ color: "#fff", fontSize: "1.15rem", fontWeight: 900, lineHeight: 1.2 }}>{eventName || "Evento especial"}</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Fecha</p>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.3 }}>{dl}</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Hora de inicio</p>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>{setupHour}:00 h</p>
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Invitados</p>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>{guestNum} personas</p>
                </div>
                {venue && (
                  <div>
                    <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Venue</p>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.3 }}>{venue}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Separador perforado */}
            <div style={{ position: "relative", height: 0 }}>
              <div style={{ borderTop: "2px dashed rgba(232,25,138,.2)" }} />
              <div style={{ position: "absolute", left: -14, top: -14, width: 28, height: 28, borderRadius: "50%", background: "var(--black)", border: "1px solid rgba(232,25,138,.15)" }} />
              <div style={{ position: "absolute", right: -14, top: -14, width: 28, height: 28, borderRadius: "50%", background: "var(--black)", border: "1px solid rgba(232,25,138,.15)" }} />
            </div>

            {/* Cliente */}
            <div style={{ background: "#0a0a18", padding: "1rem 1.5rem" }}>
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.65rem" }}>Cliente</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--gold), #7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, color: "#fff", fontSize: "1rem",
                }}>
                  {client.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{client.fullName}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                    {client.phone}{client.email ? ` · ${client.email}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Servicios contratados */}
            <div style={{ background: "#07070f", padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,.04)" }}>
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Servicios contratados</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {selected.map((s) => {
                  const isPrincipal = preselectedPkg?.id === s.assetId;
                  const prod        = allProducts.find((p) => p.id === s.assetId);
                  const price       = s.overridePrice != null ? s.overridePrice : Number(prod?.dailyRate ?? 0);
                  const lineTotal   = getHourlyTiers(prod?.sku ?? "", prod?.pricingTiers) ? price : price * s.quantity;
                  return (
                    <div key={s.assetId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                        <span style={{
                          fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "0.2rem 0.55rem", borderRadius: 6, flexShrink: 0,
                          background: isPrincipal ? "rgba(124,58,237,.2)" : "rgba(232,25,138,.12)",
                          color: isPrincipal ? "#9333ea" : "var(--gold2)",
                          border: `1px solid ${isPrincipal ? "rgba(124,58,237,.3)" : "rgba(232,25,138,.2)"}`,
                        }}>
                          {isPrincipal ? "Principal" : "Extra"}
                        </span>
                        <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.assetName}</span>
                      </div>
                      <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.88rem", flexShrink: 0 }}>
                        ${lineTotal.toLocaleString("es-MX")}
                      </span>
                    </div>
                  );
                })}
                {outOfZone && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(245,158,11,.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.2rem 0.55rem", borderRadius: 6, background: "rgba(245,158,11,.1)", color: "#fde68a", border: "1px solid rgba(245,158,11,.2)", flexShrink: 0 }}>
                        Traslado
                      </span>
                      <span style={{ color: "#fde68a", fontSize: "0.88rem" }}>Gastos de traslado</span>
                    </div>
                    <span style={{ color: "#fde68a", fontWeight: 700, fontSize: "0.85rem" }}>Por confirmar</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── PRECIO ───────────────────────────── */}
          {total > 0 && (
            <div style={{ borderRadius: 20, border: "1px solid rgba(232,25,138,.2)", overflow: "hidden" }}>
              <div style={{
                padding: "1.25rem 1.5rem",
                background: "linear-gradient(135deg, rgba(232,25,138,.07), rgba(124,58,237,.05))",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
              }}>
                <div>
                  <p style={{ color: "var(--muted)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Total estimado</p>
                  {outOfZone && <p style={{ color: "#475569", fontSize: "0.7rem", marginTop: "0.1rem" }}>Sin incluir traslado</p>}
                </div>
                <p style={{ color: "#fff", fontWeight: 900, fontSize: "1.5rem", flexShrink: 0 }}>
                  ${total.toLocaleString("es-MX")} <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>MXN</span>
                </p>
              </div>
              <div style={{
                padding: "1.25rem 1.5rem",
                background: "rgba(232,25,138,.05)",
                borderTop: "1px solid rgba(232,25,138,.18)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
              }}>
                <div>
                  <p style={{ color: "var(--gold)", fontWeight: 800, fontSize: "0.95rem" }}>Total del evento</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.7rem", marginTop: "0.1rem" }}>El equipo te contactará para coordinar el pago</p>
                </div>
                <p style={{ color: "var(--gold)", fontWeight: 900, fontSize: "1.9rem", flexShrink: 0 }}>
                  ${total.toLocaleString("es-MX")}
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginLeft: "0.25rem" }}>MXN</span>
                </p>
              </div>
            </div>
          )}

          {/* ── AVISOS ───────────────────────────── */}
          {outOfZone && (
            <div style={{ borderRadius: 14, padding: "1rem 1.25rem", background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.25)", fontSize: "0.84rem", color: "#fde68a", lineHeight: 1.55 }}>
              🚗 <strong>Gastos de traslado:</strong> Tu evento está fuera de la zona Zacatecas–Guadalupe. Te contactaremos para confirmar el costo adicional de traslado.
            </div>
          )}
          {capacityWarn && (
            <div style={{ borderRadius: 14, padding: "1rem 1.25rem", background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.25)", fontSize: "0.84rem", color: "#fca5a5", lineHeight: 1.55 }}>
              ⚠️ El paquete es para máx. {pkgCapacity} personas y tu evento tiene {guestNum}.
              {recommendation && <span> Considera <strong style={{ color: "#fff" }}>{recommendation.name}</strong> para mayor comodidad.</span>}
            </div>
          )}

          {/* ── GARANTÍAS ────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ borderRadius: 14, padding: "1rem", background: "rgba(124,58,237,.07)", border: "1px solid rgba(124,58,237,.18)", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>⏳</p>
              <p style={{ color: "#9333ea", fontWeight: 800, fontSize: "0.84rem" }}>Hold 48 horas</p>
              <p style={{ color: "var(--muted)", fontSize: "0.69rem", marginTop: "0.15rem", lineHeight: 1.4 }}>Fecha bloqueada solo para ti</p>
            </div>
            <div style={{ borderRadius: 14, padding: "1rem", background: "rgba(232,25,138,.07)", border: "1px solid rgba(232,25,138,.18)", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>🤝</p>
              <p style={{ color: "var(--gold)", fontWeight: 800, fontSize: "0.84rem" }}>Atención personalizada</p>
              <p style={{ color: "var(--muted)", fontSize: "0.69rem", marginTop: "0.15rem", lineHeight: 1.4 }}>Te contactamos para coordinar</p>
            </div>
            {hasSoundPkg && (
              <div style={{ gridColumn: "1 / -1", borderRadius: 14, padding: "1rem 1.25rem", background: "rgba(212,175,55,.06)", border: "1px solid rgba(212,175,55,.2)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>📌</span>
                <div>
                  <p style={{ color: "#d4af37", fontWeight: 800, fontSize: "0.84rem" }}>5 hrs de servicio + 1 hr de bienvenida</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "0.1rem" }}>Recepción previa + evento completo incluidos</p>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ borderRadius: 14, padding: "1rem 1.25rem", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "#EF4444", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          {/* ── CTA ──────────────────────────────── */}
          <div>
            <button onClick={handleSubmit} disabled={submitting}
              className="btn-gold disabled:opacity-50"
              style={{ width: "100%", padding: "1rem 1.5rem", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.04em", borderRadius: 14 }}>
              {submitting ? "Procesando tu reserva..." : "✦ Confirmar y apartar fecha"}
            </button>
            <p style={{ textAlign: "center", marginTop: "0.6rem", fontSize: "0.67rem", color: "#475569", lineHeight: 1.5 }}>
              Al confirmar, el equipo de Daysu se pondrá en contacto contigo para coordinar el pago y los detalles.
            </p>
            <button onClick={() => goStep(2)}
              style={{ display: "block", margin: "0.6rem auto 0", background: "none", border: "none", cursor: "pointer", color: "#52525b", fontSize: "0.82rem", fontWeight: 600 }}>
              ← Volver y editar
            </button>
          </div>

        </div>
      )}

      </div>{/* fin wrapper animado */}
    </div>
  );
}
