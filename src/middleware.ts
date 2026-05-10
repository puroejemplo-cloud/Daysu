import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Rutas que NO redirigen al mantenimiento
const BYPASS = ["/mantenimiento", "/admin", "/superadmin", "/api", "/login"];

// Auth de NextAuth solo para rutas de admin
const handleAuth = NextAuth(authConfig).auth;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Archivos estáticos — siempre dejar pasar
  if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

  // Rutas no bypasseadas → mantenimiento (aplica para TODOS, logueados o no)
  if (!BYPASS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/mantenimiento", req.url));
  }

  // Rutas admin/superadmin → correr NextAuth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handleAuth as any)(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
