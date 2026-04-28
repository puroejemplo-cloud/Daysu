import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const admin = await prisma.adminUser.findUnique({ where: { username } });
        if (!admin || !admin.isActive) return null;

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return null;

        return {
          id:       String(admin.id),
          name:     admin.fullName,
          email:    admin.email,
          username: admin.username,
          suffix:   admin.suffix,
          role:     admin.role as string,
        };
      },
    }),
  ],
});
