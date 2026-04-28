import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GalleryBlurManager from "@/components/admin/GalleryBlurManager";

export const dynamic = "force-dynamic";

export default async function GaleriaAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <p className="section-label">Galería</p>
      <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>
        Editor de Difuminado
      </h1>
      <p className="mb-8 text-sm" style={{ color: "#94a3b8" }}>
        Selecciona una imagen y arrastra sobre las zonas con rostros para difuminarlas.
        Puedes marcar varias zonas por imagen. Los cambios se aplican inmediatamente al carrusel.
      </p>
      <GalleryBlurManager />
    </div>
  );
}
