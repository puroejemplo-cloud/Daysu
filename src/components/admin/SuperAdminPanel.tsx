"use client";
import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  id: number; username: string; email: string; fullName: string;
  suffix: string; role: string; isActive: boolean; createdAt: string;
}

const emptyForm = { username: "", email: "", fullName: "", suffix: "", password: "", role: "admin" };

export default function SuperAdminPanel() {
  const [admins, setAdmins]   = useState<AdminUser[]>([]);
  const [form, setForm]       = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin-users");
    const json = await res.json();
    setAdmins(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); }
    else { setSuccess(`Admin '${json.data.username}' [${json.data.suffix}] creado.`); setForm(emptyForm); await load(); }
    setSaving(false);
  };

  const toggleActive = async (admin: AdminUser) => {
    await fetch(`/api/admin-users/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !admin.isActive }),
    });
    await load();
  };

  return (
    <div className="space-y-8">
      {/* Crear admin */}
      <form onSubmit={handleCreate} className="aura-card p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#7C3AED" }}>Nuevo administrador</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nombre completo", key: "fullName",  placeholder: "Daysi Hernández" },
            { label: "Usuario (login)", key: "username",  placeholder: "daysi" },
            { label: "Email",           key: "email",     placeholder: "daysi@aura.com", type: "email" },
            { label: "Contraseña",      key: "password",  placeholder: "Mínimo 8 caracteres", type: "password" },
            { label: "Suffix (máx 8)", key: "suffix",    placeholder: "DAY" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>{label}</label>
              <input type={type ?? "text"} value={(form as never)[key] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} required className="aura-input" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Rol</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="aura-select">
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        </div>

        {error   && <p className="text-sm font-bold" style={{ color: "#EF4444" }}>{error}</p>}
        {success && <p className="text-sm font-bold" style={{ color: "#22c55e" }}>{success}</p>}

        <button type="submit" disabled={saving}
          className="font-black px-6 py-2.5 rounded-lg text-sm disabled:opacity-50"
          style={{ background: "var(--gold)", color: "#05051a" }}>
          {saving ? "Creando..." : "+ Crear administrador"}
        </button>
      </form>

      {/* Lista de admins */}
      <div className="aura-card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(124,58,237,.2)" }}>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>
            Administradores ({admins.length})
          </p>
        </div>
        {loading && <p className="p-6 text-sm" style={{ color: "#94A3B8" }}>Cargando...</p>}
        <div className="divide-y" style={{ borderColor: "rgba(124,58,237,.08)" }}>
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: a.role === "superadmin" ? "var(--gold)" : "rgba(124,58,237,.2)", color: a.role === "superadmin" ? "#05051a" : "#9333EA" }}>
                {a.suffix}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-white">{a.fullName}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: a.role === "superadmin" ? "rgba(212,175,55,.15)" : "rgba(124,58,237,.15)", color: a.role === "superadmin" ? "#D4AF37" : "#9333EA" }}>
                    {a.role}
                  </span>
                  {!a.isActive && <span className="text-xs text-red-400">Inactivo</span>}
                </div>
                <p className="text-sm" style={{ color: "#94A3B8" }}>@{a.username} · {a.email}</p>
              </div>
              <button onClick={() => toggleActive(a)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: a.isActive ? "rgba(239,68,68,.3)" : "rgba(34,197,94,.3)", color: a.isActive ? "#EF4444" : "#22c55e" }}>
                {a.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
