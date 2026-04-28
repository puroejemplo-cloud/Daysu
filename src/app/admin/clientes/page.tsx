import ClientList from "@/components/crm/ClientList";

export const dynamic = "force-dynamic";

export default function ClientesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="section-label">Módulo 5</p>
      <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>CRM — Clientes</h1>
      <p className="mb-8" style={{ color: "#94A3B8" }}>
        Ficha completa de cada cliente, historial de eventos y fechas especiales.
      </p>
      <ClientList />
    </div>
  );
}
