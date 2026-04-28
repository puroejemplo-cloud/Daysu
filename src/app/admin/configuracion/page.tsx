import type { Metadata } from "next";
import ConfigPanel from "./ConfigPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Configuración del sistema",
  robots: { index: false },
};

export default function ConfiguracionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7C3AED" }}>⚙ Sistema</p>
      <h1 className="text-3xl font-black text-white mb-1">Configuración</h1>
      <p className="mb-8 text-sm" style={{ color: "#94A3B8" }}>
        Parámetros operativos del sistema. Cambios aplicados inmediatamente.
      </p>
      <ConfigPanel />
    </div>
  );
}
