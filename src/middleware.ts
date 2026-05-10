import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Rutas que NO redirigen al mantenimiento
const BYPASS = ["/mantenimiento", "/admin", "/superadmin", "/api", "/login"];

export default NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    authorized(params) {
      const { pathname } = params.request.nextUrl;

      // Archivos estáticos (extensión) — dejarlos pasar siempre
      const isStatic = /\.[a-z0-9]+$/i.test(pathname);

      const isBypassed = isStatic || BYPASS.some(p => pathname.startsWith(p));

      // MODO MANTENIMIENTO: redirige todo el tráfico público
      if (!isBypassed) {
        return Response.redirect(new URL("/mantenimiento", params.request.url));
      }

      // Para admin/superadmin usa la lógica de auth original
      return authConfig.callbacks?.authorized?.(params) ?? !!params.auth?.user;
    },
  },
}).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
