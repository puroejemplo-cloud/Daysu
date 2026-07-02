import { Suspense } from "react";
import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";


export const metadata: Metadata = {
  title: "Panel de administración",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Panel de control</p>
        <h1 className="admin-page-title">Panel de Administración</h1>
        <p className="admin-page-desc">Gestión de reservas, holds activos y notificaciones en tiempo real.</p>
      </header>
      <Suspense fallback={<div style={{ color: "#52525b", fontSize: "0.9rem" }}>Cargando panel...</div>}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}
