"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, PlusCircle, Images, CalendarDays,
  CheckSquare, Users, Bell, Wrench, Menu, X, LogOut, Sparkles,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const PUBLIC_LINKS = [
  { href: "/",         label: "Inicio"    },
  { href: "/catalogo", label: "Servicios" },
  { href: "/galeria",  label: "Galería"   },
  { href: "/reservar", label: "Reservar"  },
];

const ADMIN_LINKS = [
  { href: "/admin",               label: "Panel",         Icon: LayoutDashboard },
  { href: "/admin/productos",     label: "Productos",     Icon: Package         },
  { href: "/admin/ventas/nueva",  label: "Nueva venta",   Icon: PlusCircle      },
  { href: "/admin/galeria",       label: "Galería",       Icon: Images          },
  { href: "/admin/calendario",    label: "Calendario",    Icon: CalendarDays    },
  { href: "/admin/checklists",    label: "Checklist",     Icon: CheckSquare     },
  { href: "/admin/clientes",      label: "CRM",           Icon: Users           },
  { href: "/admin/recordatorios", label: "Recordatorios", Icon: Bell            },
  { href: "/admin/configuracion", label: "Configuración", Icon: Wrench          },
];

// Texto del marquee — se duplica para loop continuo
const MARQUEE_TEXT =
  "✦ Bodas · XV Años · Cumpleaños VIP · Eventos Corporativos · Zacatecas · Guadalupe · Sonido Profesional · Shows Únicos · DJ Versátil · Robot LED · Cabezones · Pirotecnia · Vals en las Nubes · Paquetes Todo Incluido  ";

export default function Navbar() {
  const path = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user        = session?.user as { suffix?: string; role?: string; name?: string } | undefined;
  const isSuperAdmin = user?.role === "superadmin";
  const isLoggedIn   = status === "authenticated";

  if (path.startsWith("/admin") || path.startsWith("/superadmin")) return null;

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  const navLinks = isLoggedIn ? ADMIN_LINKS : PUBLIC_LINKS;

  return (
    <header className="sticky top-0 z-50 safe-top"
      style={{ background: "rgba(5,5,26,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

      {/* ── BARRA DE ANUNCIO (marquee) — solo para visitantes no logueados ── */}
      {!isLoggedIn && path !== "/login" && (
        <div style={{
          background: "linear-gradient(90deg, rgba(232,25,138,0.12), rgba(124,58,237,0.08), rgba(232,25,138,0.12))",
          borderBottom: "1px solid rgba(232,25,138,0.15)",
          overflow: "hidden",
          height: "2rem",
          display: "flex",
          alignItems: "center",
        }}>
          <div style={{
            display: "flex",
            width: "max-content",
            animation: "marqueeScroll 40s linear infinite",
          }}>
            {/* Duplicado dos veces para loop continuo */}
            {[0, 1].map((i) => (
              <span key={i} style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "rgba(232,25,138,0.75)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                paddingRight: "4rem",
              }}>
                {MARQUEE_TEXT}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── BARRA PRINCIPAL ── */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4"
        style={{ height: 64 }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0"
          style={{ textDecoration: "none" }}
          aria-label="Daysu.vip — inicio">
          <img src="/logo-daysu.png" alt="Daysu.vip" aria-hidden="true"
            style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }} />
          <div className="hidden sm:flex flex-col leading-tight">
            <span style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "1.15rem",
              color: "var(--cream)",
              letterSpacing: "0.12em",
              lineHeight: 1,
            }}>
              Daysu<span style={{ color: "var(--gold)" }}>.vip</span>
            </span>
            <span style={{ fontSize: "0.55rem", color: "#52525b", letterSpacing: "0.18em", textTransform: "uppercase", lineHeight: 1.4 }}>
              Eventos · Zacatecas
            </span>
          </div>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 ml-2"
          aria-label="Navegación principal">
          {navLinks.map((l) => {
            const active = isActive(l.href);
            const Icon   = (l as { Icon?: React.ComponentType<{ size?: number }> }).Icon;
            return (
              <Link key={l.href} href={l.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all"
                style={{
                  color:          active ? "#e4e4e7" : "#71717a",
                  background:     active ? "rgba(255,255,255,0.07)" : "transparent",
                  textDecoration: "none",
                  letterSpacing:  "0.09em",
                  textTransform:  "uppercase",
                  fontSize:       "0.75rem",
                }}>
                {Icon && <Icon size={13} aria-hidden="true" />}
                {l.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link href="/superadmin/admins"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all"
              style={{ color: "#71717a", textDecoration: "none", letterSpacing: "0.09em", textTransform: "uppercase", fontSize: "0.75rem" }}>
              Admins
            </Link>
          )}
        </nav>

        {/* Links en móvil (no logueado) */}
        {!isLoggedIn && (
          <nav className="flex lg:hidden items-center gap-1 flex-1 min-w-0 ml-1"
            aria-label="Navegación móvil">
            {PUBLIC_LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link key={l.href} href={l.href}
                  aria-current={active ? "page" : undefined}
                  className="flex-1 text-center rounded-lg font-black uppercase transition-all border"
                  style={{
                    color:       active ? "#05051a" : "#71717a",
                    background:  active ? "var(--gold)" : "rgba(255,255,255,.04)",
                    borderColor: active ? "var(--gold)" : "rgba(255,255,255,.07)",
                    textDecoration: "none",
                    letterSpacing: "0.04em",
                    fontSize: "0.65rem",
                    padding: "0.65rem 0.5rem",
                    minHeight: 44,
                  }}>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}
        {isLoggedIn && <div className="flex-1 lg:hidden" />}

        {/* Derecha: usuario o CTA */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{ borderColor: "rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)" }}>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "var(--gold)", color: "#05051a", letterSpacing: "0.06em", fontSize: "0.6rem" }}>
                  {user?.suffix}
                </span>
                <span className="text-xs font-semibold" style={{ color: "#a1a1aa" }}>
                  {user?.name?.split(" ")[0]}
                </span>
              </div>
              <form action={logoutAction}>
                <button type="submit"
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.07)", color: "#52525b", background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
                  onFocus={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(232,25,138,0.5)"; }}
                  onBlur={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.boxShadow = "none"; }}>
                  <LogOut size={12} aria-hidden="true" />
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/reservar"
                className="btn-gold"
                style={{ textDecoration: "none", fontSize: "0.72rem", padding: "0.7rem 1.6rem" }}>
                <Sparkles size={13} aria-hidden="true" />
                Cotizar VIP
              </Link>
            </>
          )}
        </div>

        {/* Burger — mobile */}
        <button
          className="lg:hidden p-2 rounded-lg ml-auto"
          style={{ color: "#94A3B8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu">
          {mobileOpen
            ? <X className="w-5 h-5" aria-hidden="true" />
            : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      {/* ── Menú móvil ── */}
      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden border-t px-4 py-4 space-y-1.5"
          style={{ background: "rgba(5,5,26,.99)", borderColor: "rgba(232,25,138,.12)" }}>
          {navLinks.map((l) => {
            const active = isActive(l.href);
            const Icon   = (l as { Icon?: React.ComponentType<{ size?: number }> }).Icon;
            return (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold border transition-all"
                style={{
                  color:          active ? "#05051a"     : "#94A3B8",
                  background:     active ? "var(--gold)" : "rgba(255,255,255,.04)",
                  borderColor:    active ? "var(--gold)" : "rgba(255,255,255,.07)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}>
                {Icon && <Icon size={16} aria-hidden="true" />}
                {l.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link href="/superadmin/admins" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold"
              style={{ color: "#7C3AED", textDecoration: "none", fontSize: "0.875rem" }}>
              Gestión de administradores
            </Link>
          )}
          {isLoggedIn ? (
            <div className="pt-3 border-t mt-2 flex items-center justify-between"
              style={{ borderColor: "rgba(255,255,255,.07)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--gold)" }}>
                [{user?.suffix}] {user?.name?.split(" ")[0]}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "#EF4444" }}>
                  <LogOut size={14} aria-hidden="true" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          ) : (
            <div className="pt-3 border-t mt-2 space-y-2.5" style={{ borderColor: "rgba(255,255,255,.07)" }}>
              <Link href="/reservar" onClick={() => setMobileOpen(false)}
                className="btn-gold flex items-center justify-center gap-1.5"
                style={{ textDecoration: "none", padding: "0.8rem" }}>
                <Sparkles size={15} aria-hidden="true" />
                Cotizar VIP — Reserva tu fecha
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
