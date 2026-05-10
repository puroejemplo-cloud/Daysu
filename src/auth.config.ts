import type { NextAuthConfig } from "next-auth";

// Configuración mínima compatible con Edge runtime (sin bcrypt, sin Prisma)
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn        = !!auth?.user;
      const isSuperAdmin      = auth?.user?.role === "superadmin";
      const isAdminRoute      = nextUrl.pathname.startsWith("/admin");
      const isSuperAdminRoute = nextUrl.pathname.startsWith("/superadmin");

      if (isAdminRoute || isSuperAdminRoute) {
        if (!isLoggedIn) return false;
        if (isSuperAdminRoute && !isSuperAdmin) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.username = (user as { username: string }).username;
        token.suffix   = (user as { suffix: string }).suffix;
        token.role     = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id       = token.sub!;
        session.user.username = token.username as string;
        session.user.suffix   = token.suffix   as string;
        session.user.role     = token.role     as string;
      }
      return session;
    },
  },

  providers: [], // providers se definen en auth.ts (Node.js runtime)
};
