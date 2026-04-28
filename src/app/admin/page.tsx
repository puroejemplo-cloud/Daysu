import { Suspense } from "react";
import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel de administración",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7C3AED" }}>✦ Portal VIP Control</p>
      <h1 className="text-3xl font-black text-white mb-1">Panel de Administración</h1>
      <p className="mb-8" style={{ color: "#94A3B8" }}>Gestión de reservas, holds activos y notificaciones en tiempo real.</p>
      <Suspense fallback={<div style={{ color: "#475569", fontSize: "0.9rem" }}>Cargando panel...</div>}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}
