import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GalleryBlurManager from "@/components/admin/GalleryBlurManager";
import GalleryVideoManager from "@/components/admin/GalleryVideoManager";


export default async function GaleriaAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">Galería</p>
        <h1 className="admin-page-title">Fotos y videos</h1>
        <p className="admin-page-desc">Sube fotos y difumina rostros, o agrega videos de YouTube con su tipo de evento y paquete. Los cambios se aplican a la galería pública.</p>
      </header>
      <GalleryBlurManager />
      <hr className="admin-divider" style={{ margin: "3rem 0" }} />
      <GalleryVideoManager />
    </div>
  );
}
