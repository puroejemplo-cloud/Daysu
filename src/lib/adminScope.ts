import type { Session } from "next-auth";

export interface AdminScope {
  isSuperAdmin: boolean;
  suffix: string | undefined;
}

export function getAdminScope(session: Session): AdminScope {
  return {
    isSuperAdmin: session.user.role === "superadmin",
    suffix: session.user.suffix as string | undefined,
  };
}

/**
 * Reservas: un admin regular solo ve/opera sobre bookings que incluyan
 * al menos un producto propio (mismo criterio que /api/admin/bookings
 * y /admin/calendario). Superadmin o admin sin suffix: sin filtro.
 */
export function bookingOwnerWhere({ isSuperAdmin, suffix }: AdminScope) {
  return isSuperAdmin || !suffix
    ? {}
    : { items: { some: { isAutoBlocked: false, asset: { ownerSuffix: suffix } } } };
}

/**
 * Clientes: visibles si tienen alguna reserva con un producto propio del
 * admin, o si aun no tienen ninguna reserva (recien creados desde el CRM
 * -- ocultarlos rompería el alta manual de clientes, ya que no existe un
 * "dueño" explícito para un cliente sin reservas todavía).
 */
export function clientOwnerWhere(scope: AdminScope) {
  const { isSuperAdmin, suffix } = scope;
  if (isSuperAdmin || !suffix) return {};
  return {
    OR: [
      { bookings: { none: {} } },
      { bookings: { some: bookingOwnerWhere(scope) } },
    ],
  };
}
