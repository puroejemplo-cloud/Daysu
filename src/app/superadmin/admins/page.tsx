import SuperAdminPanel from "@/components/admin/SuperAdminPanel";

export const dynamic = "force-dynamic";

export default function AdminsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="section-label">Superadmin</p>
      <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Gestión de Administradores</h1>
      <p className="mb-8" style={{ color: "#94A3B8" }}>
        Crea y gestiona cuentas de administrador. Cada admin tiene un suffix único que identifica sus activos.
      </p>
      <SuperAdminPanel />
    </div>
  );
}
