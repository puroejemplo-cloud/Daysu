"use server";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/admin",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Usuario o contraseña incorrectos." };
    }
    throw e; // re-lanza el redirect de Next.js
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
