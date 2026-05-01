"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PhotoCarousel, { type CarouselPhoto } from "./PhotoCarousel";
import Testimonials     from "./Testimonials";
import PackageComparison from "./PackageComparison";
import CardCarousel     from "@/components/catalog/CardCarousel";

interface Package {
  id: number; name: string; dailyRate: string; originalPrice: string | null;
  description: string | null; sku: string; ownerName: string | null;
  imageUrl: string | null; imageGallery: string[]; componentNames: string[];
}

// Dueño de cada paquete
const PKG_OWNERS: Record<string, string> = {
  "DAY-DJ-AUDIO-100": "Sonido Daysu",
  "DAY-DJ-AUDIO-200": "Sonido Daysu",
  "DAY-DJ-AUDIO-500": "Sonido Daysu",
  "CAB-FOTO-OFERTA":  "Daysu.vip",
  "PKG-BASICO":      "Sonido Daysu",
  "PKG-MEDIANO":     "Sonido Daysu",
  "PKG-PREMIUM":     "Sonido Daysu · DJ Iván Events",
  "PKG-MASTER-VIP":  "Sonido Daysu · DJ Iván Events",
  "PKG-DIAMANTE":    "Sonido Daysu · DJ Iván Events",
  "PKG-SNACK-TATOO": "Sonido Daysu · DJ Iván Events",
};

// Contenido de cada paquete (datos reales)
const PKG_FEATURES: Record<string, string[]> = {
  "DAY-DJ-AUDIO-100": ["DJ Versátil + Audio básico · Cabina LED", "Hasta 100 personas", "5 hrs + 1 recepción", "Cumpleaños, bautizos, eventos día"],
  "DAY-DJ-AUDIO-200": ["DJ Versátil + Audio profesional · Cabina LED", "Hasta 200 personas", "5 hrs + 1 recepción", "Bodas, XV Años, eventos nocturnos"],
  "DAY-DJ-AUDIO-500": ["DJ Versátil + Audio completo · Cabina LED", "50 a 500 personas", "5 hrs + 1 recepción", "Eventos grandes, bodas, corporativos"],
  "CAB-FOTO-OFERTA": ["Cabina fotográfica inflable LED", "Props, galería digital, LED RGB", "Operador profesional incluido", "1 hr $2,000 · 2 hrs $3,000 · 3 hrs $3,500"],
  "PKG-BASICO":      ["DJ Versátil + Audio básico profesional", "Cabina LED", "Souvenirs (globos)", "Ideal bautizos, cumpleaños, eventos día"],
  "PKG-MEDIANO":     ["DJ Versátil + Audio básico + Cabina LED", "Iluminación básica", "Show Robot Led + pirotecnia fría", "Souvenirs (globos)"],
  "PKG-PREMIUM":     ["DJ Versátil + Audio hasta 200 px", "Iluminación profesional de escenario", "Show Cabezones (1) + Robot Led", "Maestro de ceremonias + Proyección + Video semblanza"],
  "PKG-MASTER-VIP":  ["DJ + Audio 50-500 px + Iluminación completa", "Carrito 200 shots + Show Robot Led", "Cabezones (2) + Animadores caracterizados", "Maestro de ceremonias + Video semblanza + Pirotecnia"],
  "PKG-DIAMANTE":    ["Todo Master VIP + Shot jeringas", "Arlequín en zancos + Vals en las nubes sencillo", "Cañón de confeti + Carrito 250 shots", "Pista LED y Maruchanfest disponibles como extras"],
  "PKG-SNACK-TATOO": ["Todo Diamante + Tatoo & glitter", "Vals en las nubes doble", "Maruchanfest y Pista LED disponibles como extras", "El paquete más completo"],
};

// Mapa SKU → foto local. Si la foto no existe, se usa el gradiente como fallback.
const PKG_PHOTOS: Record<string, string> = {
  "DAY-DJ-AUDIO-100": "/paquetes/pkg-dj-audio-100.svg",
  "DAY-DJ-AUDIO-200": "/paquetes/pkg-dj-audio-200.svg",
  "DAY-DJ-AUDIO-500": "/paquetes/pkg-dj-audio-500.svg",
  "CAB-FOTO-OFERTA":  "/paquetes/cab-foto-oferta.svg",
  "PKG-BASICO":       "/paquetes/pkg-basico.svg",
  "PKG-MEDIANO":     "/paquetes/pkg-mediano.svg",
  "PKG-PREMIUM":     "/paquetes/pkg-premium.svg",
  "PKG-MASTER-VIP":  "/paquetes/pkg-master-vip.svg",
  "PKG-DIAMANTE":    "/paquetes/pkg-diamante.svg",
  "PKG-SNACK-TATOO": "/paquetes/pkg-snack-tatoo.svg",
};

const CARD_COLORS = [
  { bg: "linear-gradient(135deg,#1a0e00 0%,#2d1a00 40%,#0d0d0d 100%)", geo: "#E8198A", geoW: 400, geoH: 400 },
  { bg: "linear-gradient(135deg,#05051a 0%,#0d0d2b 50%,#0d0d0d 100%)", geo: "#7C3AED", geoW: 200, geoH: 200 },
  { bg: "linear-gradient(135deg,#0d001a 0%,#1a0026 50%,#0d0d0d 100%)", geo: "#9a4cc9", geoW: 200, geoH: 200 },
  { bg: "linear-gradient(135deg,#001a0d 0%,#00261a 50%,#0d0d0d 100%)", geo: "#4cc98e", geoW: 200, geoH: 200 },
  { bg: "linear-gradient(135deg,#1a0005 0%,#2d0008 50%,#0d0d0d 100%)", geo: "#c94c4c", geoW: 200, geoH: 200 },
  { bg: "linear-gradient(135deg,#0d0a00 0%,#1a1500 50%,#0d0d0d 100%)", geo: "#c9b84c", geoW: 200, geoH: 200 },
];

const TICKER_ITEMS = [
  "Paquete Básico", "Paquete Mediano", "Paquete Premium",
  "Master VIP", "Paquete Diamante", "Snack Tatoo",
  "Show Robot Led", "Vals en las Nubes", "Pirotecnia Fría",
  "Carrito de Shots", "DJ Versátil", "Audio Profesional",
];

const STATS = [
  { num: 8,   suffix: "+",    label: "Paquetes disponibles"             },
  { num: 5,   suffix: " hrs", label: "De servicio por paquete"          },
  { num: 500, suffix: "+",    label: "Invitados máx."                   },
  { num: 100, suffix: "%",    label: "Compromiso y calidad"             },
];

const CATS = ["Todos", "Bodas", "XV Años", "Bautizos", "Cumpleaños", "Graduaciones", "Empresariales"];

const CONTACT = {
  whatsapp: "524929496372",
  phone1: "4929496372",
  phone2: "4921291862",
  zone: "Zona conurbada Zacatecas–Guadalupe",
};

export default function HomeClient({ packages, carouselImages = [] }: { packages: Package[]; carouselImages?: CarouselPhoto[] }) {
  const cursorRef     = useRef<HTMLDivElement>(null);
  const ringRef       = useRef<HTMLDivElement>(null);
  const linesRef      = useRef<HTMLDivElement>(null);
  const statsRef      = useRef<HTMLDivElement>(null);
  const [activeCat,   setActiveCat]   = useState("Todos");
  const [cursorReady, setCursorReady] = useState(false); // oculta el cursor nativo solo tras primer movimiento

  // Cursor: refs directos al DOM — sin re-renders de React
  const mxRef = useRef(0);
  const myRef = useRef(0);
  const rxRef = useRef(0);
  const ryRef = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mxRef.current = e.clientX;
      myRef.current = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - 5}px,${e.clientY - 5}px)`;
      }
      // Primera vez que se mueve: activar cursor personalizado
      setCursorReady(true);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // Ring — interpolación suave via rAF
    let raf: number;
    const animate = () => {
      rxRef.current += (mxRef.current - rxRef.current) * 0.12;
      ryRef.current += (myRef.current - ryRef.current) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rxRef.current - 18}px,${ryRef.current - 18}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []); // sin dependencias — nunca se re-ejecuta

  // Falling lines — máximo 6, solo se crean una vez
  useEffect(() => {
    const el = linesRef.current;
    if (!el || el.children.length > 0) return;
    for (let i = 0; i < 6; i++) {
      const s = document.createElement("span");
      s.style.cssText = `position:absolute;will-change:transform;width:1px;background:#E8198A;animation:linefall ${8 + Math.random() * 6}s linear ${Math.random() * 10}s infinite;opacity:0;left:${10 + Math.random() * 80}%;height:${60 + Math.random() * 120}px;`;
      el.appendChild(s);
    }
  }, []);

  // Counter animation — arranca al montar (sin IntersectionObserver, más confiable en móvil)
  useEffect(() => {
    const delay = setTimeout(() => {
      const nums = statsRef.current?.querySelectorAll<HTMLElement>("[data-target]");
      if (!nums) return;
      nums.forEach((el) => {
        const target = +el.dataset.target!;
        const suffix = el.dataset.suffix ?? "";
        let cur = 0;
        const step = Math.max(target / 60, 1);
        const t = setInterval(() => {
          cur = Math.min(cur + step, target);
          el.textContent = Math.floor(cur) + suffix;
          if (cur >= target) clearInterval(t);
        }, 25);
      });
    }, 800); // 800ms después del montaje — da tiempo a que el user vea el hero
    return () => clearTimeout(delay);
  }, []);

  // SKU del paquete "más popular"
  const POPULAR_SKU = "PKG-MEDIANO";

  // Ordenar: 1º promos, 2º popular, 3º resto por precio
  const sorted = [...packages].sort((a, b) => {
    const aPromo = !!a.originalPrice && Number(a.originalPrice) > Number(a.dailyRate);
    const bPromo = !!b.originalPrice && Number(b.originalPrice) > Number(b.dailyRate);
    if (aPromo && !bPromo) return -1;
    if (!aPromo && bPromo) return 1;
    const aPop = a.sku === POPULAR_SKU ? 0 : 1;
    const bPop = b.sku === POPULAR_SKU ? 0 : 1;
    if (aPop !== bPop) return aPop - bPop;
    return Number(a.dailyRate) - Number(b.dailyRate);
  });
  const shown = sorted.slice(0, 4);

  return (
    <div className={cursorReady ? "custom-cursor-active" : ""}>
      {/* Cursor — posición controlada via ref, sin re-renders */}
      <div ref={cursorRef} className="cursor" style={{ transform: "translate(-100px,-100px)" }} />
      <div ref={ringRef}   className="cursor-ring" style={{ transform: "translate(-100px,-100px)" }} />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="hero-section">
        {/* VIDEO de fondo con imagen fallback.
            Para mejor performance: añadir /hero-bg.webm (30-50% más ligero)
            y /hero-bg-poster.jpg (primer frame, 1280×720) en /public/ */}
        <video
          autoPlay muted loop playsInline
          poster="/hero-bg-poster.jpg"
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            zIndex: 0,
          }}>
          <source src="/hero-bg.webm" type="video/webm" />
          <source src="/hero-bg.mp4"  type="video/mp4"  />
        </video>
        {/* Overlay oscuro sobre el video para que el texto sea legible */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(to right, rgba(5,5,26,0.88) 0%, rgba(5,5,26,0.55) 55%, rgba(5,5,26,0.2) 100%), linear-gradient(to top, rgba(5,5,26,0.95) 0%, rgba(5,5,26,0.4) 40%, transparent 100%)",
        }} />

        {/* Animated lines */}
        <div ref={linesRef} style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.18, pointerEvents: "none", zIndex: 2 }} />

        {/* Ghost number — decorativo */}
        <div aria-hidden="true" style={{ position: "absolute", right: "2rem", bottom: "3rem", fontFamily: "var(--font-bebas)", fontSize: "clamp(8rem,18vw,18rem)", color: "rgba(245,240,232,0.025)", lineHeight: 1, pointerEvents: "none", userSelect: "none", overflow: "hidden", zIndex: 2 }}>
          {new Date().getFullYear().toString().slice(-2)}
        </div>

        {/* Content — encima del video */}
        <div style={{ position: "relative", zIndex: 2 }}>
        <p className="fade-up-1 section-label" style={{ display: "flex", alignItems: "center" }}>
          <span className="live-dot" aria-hidden="true" />
          Próximos eventos · {new Date().getFullYear()}
        </p>

        <h1 className="fade-up-2 bebas" style={{ fontSize: "clamp(3.5rem,9vw,9rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}>
          HAZ QUE TU<br />
          EVENTO SEA<br />
          <em style={{ fontStyle: "italic", color: "var(--gold)" }}>LEGENDARIO.</em>
        </h1>

        <p className="fade-up-3" style={{ marginTop: "1rem", fontSize: "0.88rem", fontWeight: 300, color: "var(--muted)", maxWidth: 340, lineHeight: 1.7 }}>
          Paquetes VIP de audio, DJ, shows e iluminación para bodas,
          quinceañeras y eventos hasta 500 invitados — Zacatecas.
        </p>

        {/* CTA con verificación de disponibilidad directo desde el hero */}
        <div className="fade-up-4" style={{ marginTop: "2.75rem" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd   = new FormData(e.currentTarget);
              const date = fd.get("heroDate") as string;
              const hour = fd.get("heroHour") as string;
              if (date) {
                window.location.href = `/catalogo?date=${date}&sh=${hour || "19:00"}`;
              } else {
                window.location.href = "/catalogo";
              }
            }}
            style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(232,25,138,.7)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                Fecha de tu evento
              </label>
              <input
                type="date"
                name="heroDate"
                min={new Date().toISOString().split("T")[0]}
                style={{
                  background: "rgba(232,25,138,.06)",
                  border: "1px solid rgba(232,25,138,.55)",
                  boxShadow: "0 0 10px rgba(232,25,138,.12), inset 0 1px 0 rgba(255,255,255,.05)",
                  borderRadius: 8, padding: "0.6rem 0.85rem", color: "#fff",
                  fontSize: "0.85rem", colorScheme: "dark", outline: "none",
                  fontFamily: "var(--font-dm)", cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(232,25,138,.7)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                Hora inicio
              </label>
              <input
                type="time"
                name="heroHour"
                defaultValue="19:00"
                style={{
                  background: "rgba(232,25,138,.06)",
                  border: "1px solid rgba(232,25,138,.55)",
                  boxShadow: "0 0 10px rgba(232,25,138,.12), inset 0 1px 0 rgba(255,255,255,.05)",
                  borderRadius: 8, padding: "0.6rem 0.75rem", color: "#fff",
                  fontSize: "0.85rem", colorScheme: "dark", outline: "none",
                  fontFamily: "var(--font-dm)", width: 120,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>
            <button type="submit" className="btn-gold" style={{ height: 40 }}>
              Ver disponibilidad ✦
            </button>
          </form>
          <div style={{ marginTop: "0.85rem", display: "flex", gap: "0.75rem" }}>
            <Link href="/catalogo" className="btn-ghost" style={{ fontSize: "0.78rem" }}>Ver todos los paquetes</Link>
            <Link href="/reservar" style={{ color: "rgba(232,25,138,.6)", fontSize: "0.78rem", textDecoration: "none", lineHeight: "2.5rem" }}>o cotiza ahora →</Link>
          </div>
        </div>

        </div>{/* fin content */}
        {/* Scroll indicator — hidden on mobile */}
        <div className="fade-up-5 hidden sm:flex" style={{ position: "absolute", bottom: "2rem", right: "4rem", flexDirection: "column", alignItems: "center", gap: "0.5rem", zIndex: 2 }}>
          <div style={{ width: 1, height: 50, background: "linear-gradient(to bottom, var(--gold), transparent)", animation: "scrollline 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", writingMode: "vertical-rl" }}>Scroll</span>
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────────── */}
      <div style={{
        background: "rgba(232,25,138,0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        borderBottom: "1px solid rgba(0,0,0,0.2)",
        color: "#05051a",
        padding: "0.35rem 0",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }} aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ transition: "filter 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.2)")}
              onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
              <span style={{ fontFamily: "var(--font-bebas)", fontSize: "0.88rem", letterSpacing: "0.2em", padding: "0 1.75rem", fontWeight: 700 }}>{item}</span>
              <span style={{ opacity: 0.35, fontFamily: "var(--font-bebas)" }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── PACKAGES ───────────────────────────────────────── */}
      <section className="pkg-section">
        <p className="section-label">Nuestros paquetes</p>
        <h2 className="section-title" style={{ marginBottom: "2.5rem" }}>
          Experiencias<br />para cada evento
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {shown.map((pkg, i) => {
            const c         = CARD_COLORS[i % CARD_COLORS.length];
            const gallery   = (pkg.imageGallery && pkg.imageGallery.length > 0)
              ? pkg.imageGallery
              : (pkg.imageUrl ?? PKG_PHOTOS[pkg.sku])
                ? [(pkg.imageUrl ?? PKG_PHOTOS[pkg.sku]) as string]
                : [];
            const descLines = (pkg.description ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
            const features  = descLines.length > 0 ? descLines : (PKG_FEATURES[pkg.sku] ?? []);
            const comps     = pkg.componentNames ?? [];
            const brand     = pkg.ownerName ?? PKG_OWNERS[pkg.sku] ?? "Daysu.vip";
            const isPromo   = !!pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.dailyRate);
            const isPopular = pkg.sku === POPULAR_SKU;
            const discount  = isPromo
              ? Math.round((1 - Number(pkg.dailyRate) / Number(pkg.originalPrice)) * 100)
              : 0;

            return (
              <Link key={pkg.id} href="/catalogo" className="pkg-hcard">

                {/* ── Imagen cuadrada 1:1 ── */}
                <div className="pkg-hcard-img" style={{ background: c.bg }}>
                  {gallery.length > 0
                    ? <CardCarousel images={gallery} alt={pkg.name} style={{ height: "100%", borderRadius: 0 }} />
                    : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span className="bebas" style={{ fontSize: "clamp(3rem,8vw,5rem)", color: "rgba(232,25,138,0.15)", letterSpacing: "0.06em" }}>{pkg.sku.split("-")[0]}</span>
                      </div>
                  }

                  {/* Badges sobre la imagen */}
                  {isPromo && (
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5, background: "#dc2626", color: "#fff", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.3rem 0.7rem", fontWeight: 800, borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                      🔥 -{discount}%
                    </div>
                  )}
                  {!isPromo && isPopular && (
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5, background: "var(--gold)", color: "#05051a", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.3rem 0.7rem", fontWeight: 800, borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                      ⭐ Popular
                    </div>
                  )}

                  {/* Glow overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(232,25,138,0.06) 0%, transparent 60%)", pointerEvents: "none", zIndex: 1 }} />
                </div>

                {/* ── Contenido ── */}
                <div className="pkg-hcard-body">

                  {/* Brand */}
                  <p style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#52525b", fontWeight: 700 }}>
                    {brand} · Zacatecas
                  </p>

                  {/* Nombre */}
                  <h3 className="bebas pkg-hcard-name">{pkg.name}</h3>

                  {/* Precio */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", margin: "0.65rem 0 0.9rem" }}>
                    {isPromo && (
                      <span style={{ fontSize: "0.82rem", color: "#52525b", textDecoration: "line-through" }}>
                        ${Number(pkg.originalPrice).toLocaleString("es-MX")}
                      </span>
                    )}
                    <span className="bebas" style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", color: isPromo ? "#f87171" : "var(--gold)", lineHeight: 1 }}>
                      ${Number(pkg.dailyRate).toLocaleString("es-MX")}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#52525b", fontWeight: 400 }}>MXN</span>
                  </div>

                  {/* Separador */}
                  <div style={{ height: 1, background: "rgba(232,25,138,0.12)", marginBottom: "0.9rem" }} />

                  {/* Características */}
                  {features.length > 0 && (
                    <ul className="pkg-hfeatures">
                      {features.map((f, fi) => <li key={fi}>{f}</li>)}
                    </ul>
                  )}

                  {/* Componentes BOM */}
                  {comps.length > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", fontWeight: 700, marginBottom: "0.45rem" }}>
                        Incluye equipo
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {comps.map((comp, ci) => (
                          <span key={ci} style={{ fontSize: "0.7rem", fontWeight: 500, padding: "0.2rem 0.65rem", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#71717a" }}>
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div style={{ marginTop: "auto", paddingTop: "1.25rem" }}>
                    <div className="pkg-hcard-cta">
                      Ver disponibilidad →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/catalogo" className="btn-ghost" style={{ fontSize: "0.82rem" }}>
            Ver todos los paquetes →
          </Link>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <div ref={statsRef} className="stats-grid" aria-label="Estadísticas de Daysu.vip">
        {STATS.map((s) => (
          <div key={s.label} style={{ padding: "2rem 1.25rem", background: "var(--black)", textAlign: "center" }}>
            <span className="bebas" data-target={s.num} data-suffix={s.suffix}
              aria-live="polite" aria-atomic="true"
              style={{ fontSize: "clamp(2.5rem,6vw,4rem)", color: "var(--gold)", display: "block", lineHeight: 1 }}>
              0{s.suffix}
            </span>
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginTop: "0.4rem" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Sección "Explorar" eliminada por el usuario */}

      {/* ── CARRUSEL DE FOTOS ──────────────────────────────── */}
      <PhotoCarousel images={carouselImages} />

      {/* ── TESTIMONIALES ───────────────────────────────────── */}
      <Testimonials />

      {/* ── CÓMO FUNCIONA ──────────────────────────────────── */}
      <section style={{ padding: "5rem 1.25rem 5rem", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-label" style={{ textAlign: "center" }}>Así de fácil</p>
          <h2 className="bebas section-title" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            ¿Cómo funciona?
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem" }}>
            {[
              {
                step: "01",
                icon: "📅",
                title: "Elige tu fecha",
                desc: "Selecciona el día de tu evento y verifica la disponibilidad en tiempo real. Sin compromisos todavía.",
                color: "#9333ea",
              },
              {
                step: "02",
                icon: "🎉",
                title: "Escoge tu paquete",
                desc: "Selecciona el paquete que mejor se adapta a tu evento y número de invitados. Personaliza con extras.",
                color: "#f59e0b",
              },
              {
                step: "03",
                icon: "💳",
                title: "Aparta con depósito",
                desc: "Asegura tu fecha con solo el 30% de depósito. Tu reserva queda confirmada por 48 horas.",
                color: "#38bdf8",
              },
              {
                step: "04",
                icon: "⭐",
                title: "Vive tu evento",
                desc: "Nosotros nos encargamos de todo. Tú disfruta — nosotros hacemos que sea legendario.",
                color: "#22c55e",
              },
            ].map((item) => (
              <div key={item.step}
                style={{
                  padding: "2rem 1.5rem",
                  borderRadius: 16,
                  border: `1px solid ${item.color}22`,
                  background: `linear-gradient(135deg, ${item.color}08, transparent)`,
                  position: "relative",
                  overflow: "hidden",
                }}>
                {/* Número de fondo */}
                <span style={{
                  position: "absolute", top: -10, right: 16,
                  fontFamily: "var(--font-bebas)", fontSize: "5.5rem",
                  color: `${item.color}12`, lineHeight: 1, userSelect: "none",
                  pointerEvents: "none",
                }}>
                  {item.step}
                </span>
                <div style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>{item.icon}</div>
                <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.6rem" }}>
                  {item.title}
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.65 }}>
                  {item.desc}
                </p>
                {/* Línea de acento */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${item.color}60, transparent)` }} />
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div style={{ textAlign: "center", marginTop: "3rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/catalogo" className="btn-gold">Verificar disponibilidad →</Link>
            <a href={`https://wa.me/${CONTACT.whatsapp}?text=Hola%2C%20quiero%20información%20sobre%20los%20paquetes`}
              target="_blank" rel="noopener noreferrer"
              className="btn-ghost"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Hablar por WhatsApp
            </a>
          </div>
          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.72rem", color: "#475569" }}>
            📞 {CONTACT.phone1} · {CONTACT.phone2} · {CONTACT.zone}
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="footer-section">
        <span className="bebas" style={{ fontSize: "1.3rem", color: "var(--gold)", letterSpacing: "0.12em" }}>
          DAYSU.VIP
        </span>
        <p style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.08em" }}>
          © {new Date().getFullYear()} Daysu.vip · Sonido Daysu · DJ Iván Events
        </p>
        <p style={{ fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.08em" }}>
          Instagram · TikTok · Facebook
        </p>
      </footer>
    </div>
  );
}
