"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { logoutAction } from "@/app/login/actions";
import {
  LayoutDashboard, Package, PlusCircle, Images, CalendarDays,
  CheckSquare, Users, Bell, Settings, ShieldCheck, Menu, X, Eye, LogOut,
  TrendingUp, UserCog, Heart, ChevronRight,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { href: "/admin",              label: "Panel",          Icon: LayoutDashboard },
      { href: "/admin/ventas/nueva", label: "Nueva venta",    Icon: PlusCircle      },
      { href: "/admin/calendario",   label: "Calendario",     Icon: CalendarDays    },
      { href: "/admin/productos",    label: "Productos",      Icon: Package         },
      { href: "/admin/clientes",     label: "Clientes",       Icon: Users           },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/admin/checklists",      label: "Checklists",      Icon: CheckSquare },
      { href: "/admin/recordatorios",   label: "Recordatorios",   Icon: Bell        },
      { href: "/admin/wedding-planner", label: "Wedding Planner", Icon: Heart       },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/staff",         label: "Staff",         Icon: UserCog    },
      { href: "/admin/upsell",        label: "Upsell",        Icon: TrendingUp },
      { href: "/admin/galeria",       label: "Galería",       Icon: Images     },
      { href: "/admin/configuracion", label: "Configuración", Icon: Settings   },
      { href: "/catalogo",            label: "Ver sitio",     Icon: Eye        },
    ],
  },
];

const SIDEBAR_W = 220;

// Barra de navegación inferior (móvil) — máx 5 destinos top + "Menú"
const BOTTOM_NAV = [
  { href: "/admin",            label: "Panel",    Icon: LayoutDashboard },
  { href: "/admin/calendario", label: "Agenda",   Icon: CalendarDays    },
  { href: "/admin/clientes",   label: "Clientes", Icon: Users           },
  { href: "/admin/productos",  label: "Productos", Icon: Package         },
];

function NavItem({
  href, label, Icon, active, onClick,
}: {
  href: string; label: string;
  Icon: React.ComponentType<{ size?: number }>;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        padding: "0.42rem 0.6rem 0.42rem 0.75rem",
        borderRadius: "0.5rem",
        marginBottom: "1px",
        textDecoration: "none",
        background:  active ? "rgba(232,25,138,0.09)" : "transparent",
        color:       active ? "#f4f4f5"               : "#71717a",
        borderLeft:  `2px solid ${active ? "var(--gold)" : "transparent"}`,
        transition:  "background 0.15s, color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = "#a1a1aa"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; } }}
      onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = "#71717a";  (e.currentTarget as HTMLElement).style.background = "transparent"; } }}>
      <span style={{ flexShrink: 0, color: active ? "var(--gold)" : "inherit", display: "flex" }}>
        <Icon size={14} />
      </span>
      <span style={{ fontSize: "0.78rem", fontWeight: active ? 600 : 400, letterSpacing: "0.01em", flex: 1 }}>
        {label}
      </span>
      {active && <span style={{ color: "rgba(232,25,138,0.5)", flexShrink: 0, display: "flex" }}><ChevronRight size={11} /></span>}
    </Link>
  );
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as { suffix?: string; role?: string; name?: string } | undefined;
  const isSuperAdmin = user?.role === "superadmin";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const initials = (user?.name ?? user?.suffix ?? "?").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Logo ── */}
      <div style={{ padding: "1rem 1rem 0.875rem", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <Link href="/admin" onClick={onClose} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(232,25,138,0.2), rgba(124,58,237,0.2))",
            border: "1px solid rgba(232,25,138,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <img src="/logo-daysu.png" alt="Daysu" style={{ width: 22, height: 22, objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f4f4f5", letterSpacing: "0.05em", lineHeight: 1.2 }}>
              Daysu.vip
            </p>
            <p style={{ fontSize: "0.58rem", color: "#52525b", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 1 }}>
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem 0.5rem", overflowY: "auto" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? "0.5rem" : 0 }}>
            <p style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "#3f3f46",
              padding: "0 0.75rem", marginBottom: "0.3rem", marginTop: gi > 0 ? "0.75rem" : 0,
            }}>
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
            ))}
          </div>
        ))}

        {isSuperAdmin && (
          <div style={{ marginTop: "0.75rem" }}>
            <p style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3f3f46", padding: "0 0.75rem", marginBottom: "0.3rem" }}>
              Super
            </p>
            <NavItem
              href="/superadmin/admins"
              label="Administradores"
              Icon={ShieldCheck}
              active={pathname.startsWith("/superadmin")}
              onClick={onClose}
            />
          </div>
        )}
      </nav>

      {/* ── Usuario ── */}
      <div style={{ padding: "0.625rem 0.5rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.55rem",
          padding: "0.5rem 0.625rem", borderRadius: "0.5rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          marginBottom: "0.4rem",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--gold), #a21caf)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.62rem", fontWeight: 700, color: "#fff",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
              {user?.name?.split(" ")[0] ?? "Admin"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: 2 }}>
              <span style={{
                fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em",
                background: isSuperAdmin ? "rgba(124,58,237,0.2)" : "rgba(232,25,138,0.12)",
                color: isSuperAdmin ? "#c084fc" : "#f9a8d4",
                padding: "0.1rem 0.35rem", borderRadius: 99,
                border: `1px solid ${isSuperAdmin ? "rgba(124,58,237,0.3)" : "rgba(232,25,138,0.2)"}`,
              }}>
                {isSuperAdmin ? "SUPERADMIN" : user?.suffix ?? "ADMIN"}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <form action={logoutAction}>
          <button type="submit"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "0.45rem",
              background: "transparent", border: "1px solid rgba(255,255,255,0.05)",
              color: "#52525b", fontSize: "0.72rem", cursor: "pointer", transition: "all 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(232,25,138,0.4)"; }}
            onBlur={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.boxShadow = "none"; }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.background = "transparent"; }}>
            <LogOut size={12} />
            Cerrar sesión
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.55rem", color: "#27272a", letterSpacing: "0.06em", fontFamily: "monospace" }}>
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: SIDEBAR_W,
        background: "#09090b",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        zIndex: 40,
      }} className="hidden lg:block">
        <SidebarInner />
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav aria-label="Navegación principal" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(9,9,11,0.97)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        display: "flex", alignItems: "stretch",
        padding: "0.3rem 0.25rem max(0.3rem, env(safe-area-inset-bottom))",
      }} className="lg:hidden">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              aria-current={active ? "page" : undefined}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "0.18rem", minHeight: 44,
                textDecoration: "none", borderRadius: 10,
                color: active ? "var(--gold)" : "#71717a", transition: "color 0.15s",
              }}>
              <item.Icon size={19} />
              <span style={{ fontSize: "0.6rem", fontWeight: active ? 700 : 500, letterSpacing: "0.01em" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Menú → drawer completo */}
        <button onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "0.18rem", minHeight: 44,
            background: "transparent", border: "none", cursor: "pointer",
            color: open ? "var(--gold)" : "#71717a", transition: "color 0.15s",
          }}>
          {open ? <X size={19} /> : <Menu size={19} />}
          <span style={{ fontSize: "0.6rem", fontWeight: open ? 700 : 500, letterSpacing: "0.01em" }}>Menú</span>
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 51, backdropFilter: "blur(4px)" }} />
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: 260, background: "#09090b",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            zIndex: 52, animation: "slideInLeft 0.2s ease",
          }}>
            <SidebarInner onClose={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
