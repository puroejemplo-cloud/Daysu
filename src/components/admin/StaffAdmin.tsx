"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { UserPlus, X, Pencil, Trash2, Link2, Link2Off } from "lucide-react";

interface Asset { id: number; name: string; sku: string }
interface Assignment { staffId: number; assetId: number; asset: Asset }
interface StaffMember {
  id: number; fullName: string; email: string; phone: string | null; isActive: boolean;
  assetAssignments: Assignment[];
}

const EMPTY_FORM = { fullName: "", email: "", phone: "" };

export default function StaffAdmin({ assets }: { assets: Asset[] }) {
  const [staff,    setStaff]    = useState<StaffMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<StaffMember | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/staff");
    const json = await res.json();
    setStaff(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (showForm) setTimeout(() => firstRef.current?.focus(), 50);
  }, [showForm]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErr(null);
    setShowForm(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm({ fullName: s.fullName, email: s.email, phone: s.phone ?? "" });
    setFormErr(null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setFormErr(null); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    const url    = editing ? `/api/admin/staff/${editing.id}` : "/api/admin/staff";
    const method = editing ? "PUT" : "POST";
    const res    = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setFormErr(json.error ?? "Error al guardar"); return; }
    closeForm();
    load();
    showToast(editing ? "Colaborador actualizado" : "Colaborador creado", true);
  };

  const deactivate = async (s: StaffMember) => {
    if (!confirm(`¿Dar de baja a ${s.fullName}?`)) return;
    const res = await fetch(`/api/admin/staff/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    if (res.ok) { load(); showToast("Colaborador dado de baja", true); }
    else showToast("Error al dar de baja", false);
  };

  const toggleAssignment = async (staffId: number, assetId: number, assigned: boolean) => {
    if (assigned) {
      await fetch(`/api/admin/staff/${staffId}/assignments?assetId=${assetId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/staff/${staffId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
    }
    load();
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div role="status" style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          padding: "0.6rem 1rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
          background: toast.ok ? "#14532d" : "#450a0a",
          border: `1px solid ${toast.ok ? "rgba(22,163,74,.3)" : "rgba(220,38,38,.3)"}`,
          color: toast.ok ? "#86efac" : "#fca5a5",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Botón nuevo */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
        <button onClick={openNew} style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
          background: "var(--gold)", color: "#05051a", border: "none", cursor: "pointer",
        }}>
          <UserPlus size={14} /> Nuevo colaborador
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={closeForm} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: 420,
            background: "#0f0f13", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "1.5rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e4e4e7" }}>
                {editing ? "Editar colaborador" : "Nuevo colaborador"}
              </h2>
              <button onClick={closeForm} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { key: "fullName", label: "Nombre completo *", type: "text",  required: true  },
                { key: "email",    label: "Email *",           type: "email", required: true  },
                { key: "phone",    label: "Teléfono",          type: "tel",   required: false },
              ].map((f, i) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#71717a", marginBottom: "0.3rem" }}>{f.label}</label>
                  <input
                    ref={i === 0 ? firstRef : undefined}
                    type={f.type}
                    required={f.required}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="aura-input"
                    style={{ width: "100%" }}
                  />
                </div>
              ))}
              {formErr && <p style={{ fontSize: "0.78rem", color: "#f87171" }}>{formErr}</p>}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: "0.6rem", borderRadius: 8, fontWeight: 600,
                  fontSize: "0.82rem", background: "var(--gold)", color: "#05051a",
                  border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                }}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear"}
                </button>
                <button type="button" onClick={closeForm} style={{
                  padding: "0.6rem 1rem", borderRadius: 8, fontSize: "0.82rem",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#71717a", cursor: "pointer",
                }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />)}
        </div>
      )}
      {!loading && staff.length === 0 && (
        <div className="aura-card" style={{ padding: "3rem", textAlign: "center", color: "#3f3f46" }}>
          Sin colaboradores. Crea el primero con el botón de arriba.
        </div>
      )}
      {!loading && staff.map((s) => (
        <div key={s.id} className="admin-surface" style={{ padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "rgba(232,25,138,0.12)", border: "1px solid rgba(232,25,138,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.78rem", fontWeight: 700, color: "var(--gold)",
            }}>
              {s.fullName.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e4e4e7" }}>{s.fullName}</p>
              <p style={{ fontSize: "0.75rem", color: "#52525b" }}>
                {s.email}{s.phone && ` · ${s.phone}`}
              </p>

              {/* Activos asignados */}
              {assets.length > 0 && (
                <div style={{ marginTop: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {assets.map((a) => {
                    const assigned = s.assetAssignments.some((x) => x.assetId === a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAssignment(s.id, a.id, assigned)}
                        title={assigned ? `Desasignar ${a.name}` : `Asignar ${a.name}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.2rem 0.55rem", borderRadius: 999, fontSize: "0.68rem",
                          cursor: "pointer", border: "1px solid",
                          background: assigned ? "rgba(232,25,138,0.08)" : "transparent",
                          borderColor: assigned ? "rgba(232,25,138,0.25)" : "rgba(255,255,255,0.07)",
                          color: assigned ? "var(--gold)" : "#3f3f46",
                          transition: "all 0.15s",
                        }}>
                        {assigned ? <Link2 size={10} /> : <Link2Off size={10} />}
                        {a.sku}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
              <button onClick={() => openEdit(s)} title="Editar"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "0.35rem 0.5rem", color: "#71717a", cursor: "pointer" }}>
                <Pencil size={13} />
              </button>
              <button onClick={() => deactivate(s)} title="Dar de baja"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "0.35rem 0.5rem", color: "#71717a", cursor: "pointer" }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
