import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";

// Punto de entrada de la PWA (manifest start_url).
// Con sesión activa → va directo al panel; sin sesión → homepage pública.
// Debe evaluarse por request (depende de la cookie de sesión), nunca cachearse.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abriendo Daysu.vip…",
  robots: { index: false, follow: false },
};

export default async function LaunchPage() {
  const session = await auth();
  redirect(session?.user ? "/admin" : "/");
}
