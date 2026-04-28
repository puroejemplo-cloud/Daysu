import SuperAdminPanel from "@/components/admin/SuperAdminPanel";

export const dynamic = "force-dynamic";

export default function AdminsPage() {
  return (
    <div className="admin-page" style={{ maxWidth: "56rem" }}>
      <header className="admin-page-header">
        <p className="admin-label">Superadmin</p>
        <h1 className="admin-page-title">Gestión de Administradores</h1>
        <p className="admin-page-desc">Crea y gestiona cuentas. Cada admin tiene un suffix único que identifica sus activos.</p>
      </header>
      <SuperAdminPanel />
    </div>
  );
}
