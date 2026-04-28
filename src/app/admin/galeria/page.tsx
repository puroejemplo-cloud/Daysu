import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GalleryBlurManager from "@/components/admin/GalleryBlurManager";

export const dynamic = "force-dynamic";

export default async function GaleriaAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Galería</p>
        <h1 className="admin-page-title">Editor de Difuminado</h1>
        <p className="admin-page-desc">Arrastra sobre zonas con rostros para difuminarlas. Los cambios se aplican al carrusel público.</p>
      </header>
      <GalleryBlurManager />
    </div>
  );
}
