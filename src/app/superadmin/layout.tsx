import AdminSidebar from "@/components/admin/AdminSidebar";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSidebar />
      <div className="lg:ml-[220px]" style={{ minHeight: "100vh", background: "#09090b" }}>
        {children}
      </div>
    </>
  );
}
