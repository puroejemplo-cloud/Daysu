import ClientList from "@/components/crm/ClientList";


export default function ClientesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <p className="admin-label">CRM</p>
        <h1 className="admin-page-title">Clientes</h1>
        <p className="admin-page-desc">Ficha de cada cliente, historial de eventos y fechas especiales.</p>
      </header>
      <ClientList />
    </div>
  );
}
