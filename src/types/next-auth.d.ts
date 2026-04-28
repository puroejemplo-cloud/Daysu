import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:       string;
      username: string;
      suffix:   string;
      role:     string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    suffix:   string;
    role:     string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    suffix:   string;
    role:     string;
  }
}
