import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSidebar />
      {/* Contenido desplazado a la derecha del sidebar en desktop */}
      <div className="lg:ml-[220px]" style={{ minHeight: "100vh", background: "#09090b" }}>
        {children}
      </div>
    </>
  );
}
