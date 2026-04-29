import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminQuickSale from "@/components/admin/AdminQuickSale";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-[220px]" style={{ minHeight: "100vh", background: "#09090b" }}>
        {children}
      </div>
      <AdminQuickSale />
    </>
  );
}
