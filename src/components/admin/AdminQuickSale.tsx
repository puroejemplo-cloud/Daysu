"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle } from "lucide-react";

export default function AdminQuickSale() {
  const pathname = usePathname();
  // No mostrar en la propia página de nueva venta
  if (pathname === "/admin/ventas/nueva") return null;

  return (
    <Link
      href="/admin/ventas/nueva"
      aria-label="Nueva venta"
      style={{
        position: "fixed",
        bottom: "1.75rem",
        right: "1.75rem",
        zIndex: 9980,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "var(--gold)",
        color: "#05051a",
        borderRadius: 999,
        padding: "0.7rem 1.25rem 0.7rem 1rem",
        boxShadow: "0 4px 24px rgba(201,168,76,.45), 0 1px 6px rgba(0,0,0,.4)",
        textDecoration: "none",
        fontFamily: "var(--font-dm, sans-serif)",
        fontWeight: 700,
        fontSize: "0.85rem",
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(201,168,76,.6), 0 2px 8px rgba(0,0,0,.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(201,168,76,.45), 0 1px 6px rgba(0,0,0,.4)";
      }}>
      <PlusCircle size={18} style={{ flexShrink: 0 }} />
      Nueva venta
    </Link>
  );
}
