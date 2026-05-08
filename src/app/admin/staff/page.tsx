import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import StaffAdmin from "@/components/admin/StaffAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff · EventMaster" };

export default async function StaffPage() {
  const assets = await prisma.asset.findMany({
    where: { isActive: true, isRentable: true },
    select: { id: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="admin-page" style={{ maxWidth: "52rem" }}>
      <header className="admin-page-header">
        <p className="admin-label">Equipo</p>
        <h1 className="admin-page-title">Staff</h1>
        <p className="admin-page-desc">Colaboradores y su asignación a activos. Haz clic en un SKU para asignar o desasignar.</p>
      </header>
      <StaffAdmin assets={assets} />
    </div>
  );
}
