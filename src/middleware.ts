import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Excluye assets estáticos (public/) y rutas llamadas por servicios externos
  // (Stripe webhook, cron), que no dependen de la sesión de NextAuth.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/webhooks|api/cron|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|json|txt|xml|css|js|map|html)$).*)",
  ],
};
