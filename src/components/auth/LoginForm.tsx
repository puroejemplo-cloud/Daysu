"use client";
import { useState, useTransition } from "react";
import { loginAction } from "@/app/login/actions";

export default function LoginForm() {
  const [error, setError]       = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="aura-card p-7 space-y-5">
      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>
          Usuario
        </label>
        <input
          name="username"
          type="text"
          placeholder="tu_usuario"
          required
          autoComplete="username"
          className="aura-input"
        />
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="aura-input"
        />
      </div>

      {error && (
        <p className="text-sm font-bold text-center" style={{ color: "#EF4444" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3.5 font-black text-sm uppercase tracking-widest rounded-xl disabled:opacity-50 transition-opacity"
        style={{ background: "var(--gold)", color: "#05051a" }}
      >
        {pending ? "Verificando..." : "Ingresar al panel ✦"}
      </button>
    </form>
  );
}
