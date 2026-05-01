"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { logoutAction } from "@/app/login/actions";
import {
  LayoutDashboard, Package, PlusCircle, Images, CalendarDays,
  CheckSquare, Users, Bell, Settings, ShieldCheck, Menu, X, Eye, LogOut,
} from "lucide-react";

const NAV_PRIMARY = [
  { href: "/admin",               label: "Panel",         Icon: LayoutDashboard },
  { href: "/admin/productos",     label: "Productos",     Icon: Package         },
  { href: "/admin/ventas/nueva",  label: "Nueva venta",   Icon: PlusCircle      },
  { href: "/admin/calendario",    label: "Calendario",    Icon: CalendarDays    },
  { href: "/admin/checklists",    label: "Checklists",    Icon: CheckSquare     },
  { href: "/admin/clientes",      label: "Clientes",      Icon: Users           },
  { href: "/admin/recordatorios", label: "Recordatorios", Icon: Bell            },
];

const NAV_SECONDARY = [
  { href: "/admin/galeria",       label: "Galería",       Icon: Images          },
  { href: "/admin/configuracion", label: "Configuración", Icon: Settings        },
  { href: "/catalogo",            label: "Ver sitio",     Icon: Eye             },
];

const SIDEBAR_W = 220;

function NavLink({
  href, label, Icon, active, onClick,
}: {
  href: string; label: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        padding: "0.5rem 0.75rem", borderRadius: "0.45rem",
        marginBottom: "1px", textDecoration: "none",
        background: active ? "rgba(255,255,255,0.07)" : "transparent",
        color:      active ? "#e4e4e7" : "#52525b",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#a1a1aa"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#52525b"; }}>
      <Icon size={15} style={{ flexShrink: 0, color: active ? "#FF3DA8" : "inherit" }} />
      <span style={{ fontSize: "0.8rem", fontWeight: active ? 500 : 400, letterSpacing: "0.01em" }}>
        {label}
      </span>
    </Link>
  );
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const pathname   = usePathname();
  const { data: session } = useSession();
  const user       = session?.user as { suffix?: string; role?: string; name?: string } | undefined;
  const isSuperAdmin = user?.role === "superadmin";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Logo ── */}
      <div style={{ padding: "1.25rem 1rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <Link href="/admin" onClick={onClose}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <img src="/logo-daysu.png" alt="Daysu.vip"
            style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e4e4e7", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Daysu.vip
          </p>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "0.75rem 0.625rem 0.5rem", overflowY: "auto" }}>
        {/* Primary */}
        {NAV_PRIMARY.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0.6rem 0.375rem" }} />

        {/* Secondary */}
        {NAV_SECONDARY.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
        ))}

        {isSuperAdmin && (
          <NavLink
            href="/superadmin/admins"
            label="Administradores"
            Icon={ShieldCheck}
            active={pathname.startsWith("/superadmin")}
            onClick={onClose}
          />
        )}
      </nav>

      {/* ── Usuario + Logout ── */}
      <div style={{ padding: "0.75rem 0.625rem", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {/* User badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.5rem 0.625rem", borderRadius: "0.45rem",
          background: "rgba(255,255,255,0.03)", marginBottom: "0.5rem",
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "var(--gold)", color: "#05051a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.6rem", fontWeight: 700, flexShrink: 0,
          }}>
            {user?.suffix?.charAt(0) ?? "?"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name?.split(" ")[0] ?? "Admin"}
            </p>
            <p style={{ fontSize: "0.6rem", color: "#52525b" }}>[{user?.suffix}]</p>
          </div>
        </div>

        {/* Logout */}
        <form action={logoutAction}>
          <button type="submit"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.4rem", padding: "0.45rem 0.75rem", borderRadius: "0.45rem",
              background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
              color: "#52525b", fontSize: "0.75rem", cursor: "pointer", transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Label de la página actual para el mobile topbar
  const allLinks = [...NAV_PRIMARY, ...NAV_SECONDARY];
  const current  = allLinks.find((l) =>
    l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href)
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: SIDEBAR_W,
        background: "#09090b",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        zIndex: 40,
      }} className="hidden lg:block">
        <SidebarInner />
      </aside>

      {/* ── Mobile top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(9,9,11,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.7rem 1rem",
      }} className="lg:hidden">
        {/* Botón toggle — izquierda, abre y cierra */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          style={{
            background: open ? "rgba(232,25,138,0.12)" : "transparent",
            border: `1px solid ${open ? "rgba(232,25,138,0.3)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: "0.4rem", padding: "0.3rem 0.45rem",
            color: open ? "var(--gold)" : "#71717a",
            cursor: "pointer", display: "flex", flexShrink: 0,
            transition: "all 0.15s",
          }}>
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>

        {/* Logo + página actual */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
          <img src="/logo-daysu.png" alt="" aria-hidden="true"
            style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current?.label ?? "Admin"}
          </span>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <>
          {/* Overlay — clic fuera cierra */}
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 48, backdropFilter: "blur(3px)" }} />
          {/* Drawer */}
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: 260,
            background: "#09090b",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            zIndex: 49,
            animation: "slideInLeft 0.2s ease",
          }}>
            <SidebarInner onClose={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
