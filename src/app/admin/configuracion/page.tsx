import type { Metadata } from "next";
import ConfigPanel from "./ConfigPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Configuración del sistema",
  robots: { index: false },
};

export default function ConfiguracionPage() {
  return (
    <div className="admin-page" style={{ maxWidth: "48rem" }}>
      <header className="admin-page-header">
        <p className="admin-label">Sistema</p>
        <h1 className="admin-page-title">Configuración</h1>
        <p className="admin-page-desc">Parámetros operativos. Los cambios se aplican inmediatamente.</p>
      </header>
      <ConfigPanel />
    </div>
  );
}
