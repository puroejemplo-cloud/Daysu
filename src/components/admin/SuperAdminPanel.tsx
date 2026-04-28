"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, ShieldCheck, User } from "lucide-react";

interface AdminUser {
  id: number; username: string; email: string; fullName: string;
  suffix: string; role: string; isActive: boolean; createdAt: string;
}

const emptyForm = { username: "", email: "", fullName: "", suffix: "", password: "", role: "admin" };

export default function SuperAdminPanel() {
  const [admins,  setAdmins]  = useState<AdminUser[]>([]);
  const [form,    setForm]    = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
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
    <div className="space-y-5">
      {/* Crear admin */}
      <form onSubmit={handleCreate} className="aura-card p-5 space-y-4">
        <p className="admin-label">Nuevo administrador</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Nombre completo", key: "fullName",  placeholder: "Daysi Hernández" },
            { label: "Usuario (login)", key: "username",  placeholder: "daysi" },
            { label: "Email",           key: "email",     placeholder: "daysi@aura.com", type: "email" },
            { label: "Contraseña",      key: "password",  placeholder: "Mínimo 8 caracteres", type: "password" },
            { label: "Suffix (máx 8)", key: "suffix",    placeholder: "DAY" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="admin-label block mb-1.5">{label}</label>
              <input type={type ?? "text"} value={(form as never)[key] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} required className="aura-input" />
            </div>
          ))}
          <div>
            <label className="admin-label block mb-1.5">Rol</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="aura-select">
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        </div>

        {error   && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
        {success && <p className="text-xs" style={{ color: "#4ade80" }}>{success}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-sm disabled:opacity-50"
          style={{ background: "var(--gold)", color: "#05051a" }}>
          <Plus size={15} />
          {saving ? "Creando..." : "Crear administrador"}
        </button>
      </form>

      {/* Lista de admins */}
      <div className="aura-card overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="admin-label">Administradores · {admins.length}</p>
        </div>
        {loading && <p className="p-5 text-sm" style={{ color: "#52525b" }}>Cargando...</p>}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: a.role === "superadmin" ? "var(--gold)" : "#18181b", color: a.role === "superadmin" ? "#05051a" : "#71717a", border: "1px solid rgba(255,255,255,0.08)" }}>
                {a.suffix}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "#e4e4e7" }}>{a.fullName}</span>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#71717a" }}>
                    {a.role === "superadmin"
                      ? <ShieldCheck size={11} style={{ color: "#d4af37" }} />
                      : <User size={11} />}
                    {a.role}
                  </span>
                  {!a.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "rgba(220,38,38,0.08)", color: "#f87171", border: "1px solid rgba(220,38,38,0.15)" }}>
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>@{a.username} · {a.email}</p>
              </div>
              <button onClick={() => toggleActive(a)}
                className="text-xs font-medium px-3 py-1.5 rounded-md border transition-all"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#52525b", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
                {a.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
