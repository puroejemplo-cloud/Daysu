import fs from 'fs';

const ROOT = 'C:/Users/DN/Desktop/EventMaster Aura Producciones/';

const PAGES = [
  {
    file: 'src/app/admin/productos/page.tsx',
    from: `<div className="max-w-6xl mx-auto px-4 py-10">
  <p className="section-label">Inventario</p>
  <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Productos y Paquetes</h1>
  <p className="mb-8" style={{ color: "#94A3B8" }}>
    Tus activos llevan el sufijo{" "}
    <span className="font-black" style={{ color: "var(--gold)" }}>
      [{(session?.user as { suffix?: string })?.suffix ?? "?"}]
    </span>.
    Crea <strong className="text-white">paquetes rentables</strong> o{" "}
    <strong className="text-white">componentes internos</strong> (cables, bases, accesorios que forman parte de un paquete).
  </p>`,
    to: `<div className="admin-page">
  <header className="admin-page-header">
    <p className="admin-label">Inventario</p>
    <h1 className="admin-page-title">Productos y Paquetes</h1>
    <p className="admin-page-desc">
      Suffix <span style={{ color: "var(--gold)", fontWeight: 600 }}>[{(session?.user as { suffix?: string })?.suffix ?? "?"}]</span> · Crea paquetes rentables o componentes internos del BOM.
    </p>
  </header>`,
  },
  {
    file: 'src/app/admin/clientes/page.tsx',
    from: `<div className="max-w-5xl mx-auto px-4 py-10">
  <p className="section-label">Módulo 5</p>
  <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>CRM — Clientes</h1>
  <p className="mb-8" style={{ color: "#94A3B8" }}>
    Ficha completa de cada cliente, historial de eventos y fechas especiales.
  </p>`,
    to: `<div className="admin-page">
  <header className="admin-page-header">
    <p className="admin-label">CRM</p>
    <h1 className="admin-page-title">Clientes</h1>
    <p className="admin-page-desc">Ficha de cada cliente, historial de eventos y fechas especiales.</p>
  </header>`,
  },
  {
    file: 'src/app/admin/calendario/page.tsx',
    from: `<div className="max-w-6xl mx-auto px-4 py-10">
  <p className="section-label">Agenda</p>
  <h1 className="bebas text-white mb-6" style={{ fontSize: "2.5rem" }}>Calendario de Eventos</h1>`,
    to: `<div className="admin-page">
  <header className="admin-page-header">
    <p className="admin-label">Agenda</p>
    <h1 className="admin-page-title">Calendario de Eventos</h1>
  </header>`,
  },
  {
    file: 'src/app/admin/galeria/page.tsx',
    from: `<div className="max-w-6xl mx-auto px-4 py-10">
  <p className="section-label">Galería</p>
  <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>
    Editor de Difuminado
  </h1>
  <p className="mb-8 text-sm" style={{ color: "#94a3b8" }}>
    Selecciona una imagen y arrastra sobre las zonas con rostros para difuminarlas.
    Puedes marcar varias zonas por imagen. Los cambios se aplican inmediatamente al carrusel.
  </p>`,
    to: `<div className="admin-page">
  <header className="admin-page-header">
    <p className="admin-label">Galería</p>
    <h1 className="admin-page-title">Editor de Difuminado</h1>
    <p className="admin-page-desc">Arrastra sobre las zonas con rostros para difuminarlas. Los cambios se aplican al carrusel público.</p>
  </header>`,
  },
  {
    file: 'src/app/admin/configuracion/page.tsx',
    from: `<div className="max-w-3xl mx-auto px-4 py-10">
  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7C3AED" }}>⚙ Sistema</p>
  <h1 className="text-3xl font-black text-white mb-1">Configuración</h1>
  <p className="mb-8 text-sm" style={{ color: "#94A3B8" }}>
    Parámetros operativos del sistema. Cambios aplicados inmediatamente.
  </p>`,
    to: `<div className="admin-page" style={{ maxWidth: "48rem" }}>
  <header className="admin-page-header">
    <p className="admin-label">Sistema</p>
    <h1 className="admin-page-title">Configuración</h1>
    <p className="admin-page-desc">Parámetros operativos. Los cambios se aplican inmediatamente.</p>
  </header>`,
  },
  {
    file: 'src/app/admin/ventas/nueva/page.tsx',
    from: `<div className="max-w-3xl mx-auto px-4 py-10">
      <p className="section-label">Ventas</p>
      <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Registrar Venta Manual</h1>
      <p className="mb-8" style={{ color: "#94A3B8" }}>
        Registra un evento que cerraste directamente. Los productos quedan bloqueados para esas fechas.
      </p>`,
    to: `<div className="admin-page" style={{ maxWidth: "52rem" }}>
      <header className="admin-page-header">
        <p className="admin-label">Ventas</p>
        <h1 className="admin-page-title">Registrar Venta Manual</h1>
        <p className="admin-page-desc">Registra un evento cerrado directamente. Los productos quedan bloqueados para esas fechas.</p>
      </header>`,
  },
  {
    file: 'src/app/superadmin/admins/page.tsx',
    from: `<div className="max-w-4xl mx-auto px-4 py-10">
  <p className="section-label">Superadmin</p>
  <h1 className="bebas text-white mb-1" style={{ fontSize: "2.5rem" }}>Gestión de Administradores</h1>
  <p className="mb-8" style={{ color: "#94A3B8" }}>
    Crea y gestiona cuentas de administrador. Cada admin tiene un suffix único que identifica sus activos.
  </p>`,
    to: `<div className="admin-page" style={{ maxWidth: "56rem" }}>
  <header className="admin-page-header">
    <p className="admin-label">Superadmin</p>
    <h1 className="admin-page-title">Gestión de Administradores</h1>
    <p className="admin-page-desc">Crea y gestiona cuentas de administrador. Cada admin tiene un suffix único que identifica sus activos.</p>
  </header>`,
  },
  {
    file: 'src/app/admin/upsell/page.tsx',
    from: `<div className="max-w-4xl mx-auto px-4 py-10">
  <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">Reglas de Upselling</h1>
  <p className="text-gray-500 mb-8">
    Define qué artículos sugerir cuando el cliente selecciona ciertos equipos, y el descuento a ofrecer.
  </p>`,
    to: `<div className="admin-page" style={{ maxWidth: "56rem" }}>
  <header className="admin-page-header">
    <p className="admin-label">Marketing</p>
    <h1 className="admin-page-title">Reglas de Upselling</h1>
    <p className="admin-page-desc">Define qué artículos sugerir cuando el cliente selecciona ciertos equipos.</p>
  </header>`,
  },
];

let ok = 0, miss = 0;
for (const p of PAGES) {
  const full = ROOT + p.file;
  let content = fs.readFileSync(full, 'utf8');
  if (content.includes(p.from)) {
    content = content.replace(p.from, p.to);
    fs.writeFileSync(full, content, 'utf8');
    console.log('✅', p.file);
    ok++;
  } else {
    console.log('❌ MISS:', p.file);
    miss++;
  }
}
console.log(`\n${ok} actualizados, ${miss} no encontrados`);
