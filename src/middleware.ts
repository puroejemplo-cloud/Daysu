import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Solo usa authConfig (Edge-compatible, sin bcrypt ni Prisma)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/superadmin/:path*"],
};
