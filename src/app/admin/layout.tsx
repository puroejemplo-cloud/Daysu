import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminQuickSale from "@/components/admin/AdminQuickSale";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSidebar />
      <div className="admin-content">
        {children}
      </div>
      <AdminQuickSale />
    </>
  );
}
