"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, PlusCircle, Images, CalendarDays,
  CheckSquare, Users, Bell, Settings, Wrench, Menu, X, LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const PUBLIC_LINKS = [
  { href: "/",         label: "Inicio" },
  { href: "/catalogo", label: "Servicios" },
  { href: "/reservar", label: "Reservas" },
];

const ADMIN_LINKS = [
  { href: "/admin",               label: "Panel",         Icon: LayoutDashboard },
  { href: "/admin/productos",     label: "Productos",     Icon: Package         },
  { href: "/admin/ventas/nueva",  label: "Nueva venta",   Icon: PlusCircle      },
  { href: "/admin/galeria",       label: "Galería",       Icon: Images          },
  { href: "/admin/calendario",    label: "Calendario",    Icon: CalendarDays    },
  { href: "/admin/checklists",    label: "Checklist",     Icon: CheckSquare     },
  { href: "/admin/clientes",      label: "CRM",           Icon: Users           },
  { href: "/admin/recordatorios",  label: "Recordatorios",  Icon: Bell    },
  { href: "/admin/configuracion", label: "Configuración",  Icon: Wrench  },
];

export default function Navbar() {
  const path = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user as { suffix?: string; role?: string; name?: string } | undefined;
  const isSuperAdmin = user?.role === "superadmin";
  const isLoggedIn   = status === "authenticated";

  // En rutas admin/superadmin el sidebar maneja toda la navegación
  if (path.startsWith("/admin") || path.startsWith("/superadmin")) return null;

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  const navLinks = isLoggedIn ? ADMIN_LINKS : PUBLIC_LINKS;

  return (
    <header className="sticky top-0 z-50 border-b safe-top"
      style={{ background: isLoggedIn ? "rgba(9,9,11,0.97)" : "rgba(5,5,26,0.95)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.07)" }}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" style={{ textDecoration: "none" }} aria-label="Aura Producciones — inicio">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ background: "var(--gold)", color: "#05051a" }}
            aria-hidden="true">
            A
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="text-sm tracking-widest uppercase" style={{ fontFamily: "var(--font-bebas)", color: "var(--cream)", letterSpacing: "0.15em" }}>Aura</span>
            <span className="block text-[9px] tracking-[.2em] uppercase" style={{ color: "#71717a" }}>Producciones VIP</span>
          </div>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1" aria-label="Navegación principal">
          {navLinks.map((l) => {
            const active = isActive(l.href);
            const Icon   = (l as { Icon?: React.ComponentType<{ size?: number }> }).Icon;
            return (
              <Link key={l.href} href={l.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  color:          active ? "#e4e4e7" : "#52525b",
                  background:     active ? "rgba(255,255,255,0.07)" : "transparent",
                  textDecoration: "none",
                  letterSpacing:  "0.03em",
                }}>
                {Icon && <Icon size={13} aria-hidden="true" />}
                {l.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link href="/superadmin/admins"
              aria-current={path.startsWith("/superadmin") ? "page" : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{ color: "#52525b", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
              <Settings size={13} aria-hidden="true" />
              Admins
            </Link>
          )}
        </nav>

        {/* Links visibles en móvil (no logueado) */}
        {!isLoggedIn && (
          <nav className="flex lg:hidden items-center gap-1 flex-1 min-w-0" aria-label="Navegación móvil">
            {PUBLIC_LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link key={l.href} href={l.href}
                  aria-current={active ? "page" : undefined}
                  className="flex-1 text-center py-1.5 rounded-lg text-xs font-black uppercase transition-all border"
                  style={{
                    color: active ? "#05051a" : "#94A3B8",
                    background: active ? "var(--gold)" : "rgba(255,255,255,.04)",
                    borderColor: active ? "var(--gold)" : "rgba(255,255,255,.06)",
                    textDecoration: "none", letterSpacing: "0.04em", fontSize: "0.65rem",
                    boxShadow: active ? "0 0 10px rgba(201,168,76,.3)" : "none",
                  }}>
                  {l.label}
                </Link>
              );
            })}
            {/* Acceso administrador directo en móvil */}
            <Link href="/login"
              className="flex-shrink-0 py-1.5 px-2 rounded-lg text-xs font-black border transition-all"
              style={{
                color: "#7C3AED", borderColor: "rgba(124,58,237,.4)",
                background: "rgba(124,58,237,.08)", textDecoration: "none", fontSize: "0.65rem",
              }}>
              Admin
            </Link>
          </nav>
        )}
        {isLoggedIn && <div className="flex-1 lg:hidden" />}

        {/* Derecha: usuario o CTA */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border"
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
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.07)", color: "#52525b", background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
                  <LogOut size={12} aria-hidden="true" />
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold" style={{ color: "#94A3B8", textDecoration: "none" }}>
                Administrador
              </Link>
              <Link href="/reservar" className="btn-gold text-sm px-5 py-2" style={{ textDecoration: "none" }}>
                Cotizar VIP ✦
              </Link>
            </>
          )}
        </div>

        {/* Burger — mobile */}
        <button
          className="lg:hidden p-1 rounded"
          style={{ color: "#94A3B8" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu">
          {mobileOpen
            ? <X className="w-6 h-6" aria-hidden="true" />
            : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden border-t px-4 py-4 space-y-1"
          style={{ background: "rgba(5,5,26,.98)", borderColor: "rgba(201,168,76,.15)" }}>
          {navLinks.map((l) => {
            const active = isActive(l.href);
            const Icon   = (l as { Icon?: React.ComponentType<{ size?: number }> }).Icon;
            return (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-black border transition-all"
                style={{
                  color:          active ? "#05051a"     : "#94A3B8",
                  background:     active ? "var(--gold)" : "rgba(255,255,255,.04)",
                  borderColor:    active ? "var(--gold)" : "rgba(255,255,255,.07)",
                  textDecoration: "none",
                }}>
                {Icon && <Icon size={15} aria-hidden="true" />}
                {l.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link href="/superadmin/admins" onClick={() => setMobileOpen(false)}
              aria-current={path.startsWith("/superadmin") ? "page" : undefined}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold"
              style={{ color: "#7C3AED", textDecoration: "none" }}>
              <Settings size={15} aria-hidden="true" />
              Gestión de administradores
            </Link>
          )}
          {isLoggedIn ? (
            <div className="pt-2 border-t mt-2 flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,.06)" }}>
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
            <div className="pt-2 border-t mt-2 space-y-2" style={{ borderColor: "rgba(255,255,255,.06)" }}>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-bold"
                style={{ color: "#94A3B8", textDecoration: "none" }}>
                Ingresar como administrador
              </Link>
              <Link href="/reservar" onClick={() => setMobileOpen(false)}
                className="btn-gold block text-center text-sm"
                style={{ textDecoration: "none" }}>
                Cotizar VIP ✦
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
