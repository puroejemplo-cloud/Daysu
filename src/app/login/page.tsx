import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Acceso administrativo",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--black)" }}>
      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-black text-2xl"
            style={{ background: "var(--gold)", color: "#05051a", boxShadow: "0 0 24px rgba(201,168,76,.4)" }}>
            A
          </div>
          <h1 className="bebas text-white tracking-widest" style={{ fontSize: "1.8rem" }}>
            AURA PRODUCCIONES VIP
          </h1>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>
            Panel de administración
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
