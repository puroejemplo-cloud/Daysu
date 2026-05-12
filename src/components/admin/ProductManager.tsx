"use client";
import { useEffect, useState, useCallback } from "react";
import { type PricingConfig, getPricingTiers } from "@/lib/product-tiers";

interface Category { id: number; name: string }
interface AssetComp {
  childAssetId: number; quantity: number; overridePrice?: string | null;
  childAsset: { id: number; name: string; dailyRate: string; ownerSuffix: string | null };
}
interface Asset {
  id: number; name: string; sku: string; dailyRate: string; originalPrice: string | null;
  totalUnits: number; isRentable: boolean; isActive: boolean; displayName: string;
  ownerSuffix: string | null; categoryId: number; maxGuests: number | null;
  assetType: string; // "package" | "product" | "component"
  description: string | null; imageUrl: string | null; imageGallery: string[] | null;
  extraCategoryIds?: number[] | null;
  pricingTiers?: PricingConfig | null;
  isRecommended: boolean;
  promoType: string | null;
  promoMinValue: number | null;
  category: { name: string };
  components: AssetComp[];
  componentTotal?: number;
}
interface AvailComp {
  id: number; name: string;
  pricingTiers?: import("@/lib/product-tiers").PricingConfig | null;
  assetType?: string;
}

type Tab = "paquetes" | "productos" | "componentes" | "otros";

const emptyForm = { categoryId: "", name: "", sku: "", description: "", totalUnits: "1", dailyRate: "0", isRentable: true, assetType: "package" };

export default function ProductManager({ categories, userSuffix }: { categories: Category[]; userSuffix: string | null }) {
  const [assets, setAssets]        = useState<Asset[]>([]);
  const [avComps, setAvComps]      = useState<AvailComp[]>([]); // componentes disponibles para BOM (dinámico)
  const [loading, setLoading]      = useState(true);
  const [form, setForm]            = useState(emptyForm);
  const [saving, setSaving]        = useState(false);
  const [msg, setMsg]              = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editingId, setEditingId]  = useState<number | null>(null);
  const [editDetail, setEditDetail]= useState<Asset | null>(null);
  const [editForm, setEditForm]    = useState<Record<string, string | boolean>>({});
  const [editBomId, setEditBomId]   = useState<number | null>(null);
  const [newComp, setNewComp]       = useState<{ childAssetId: string; quantity: string; overridePrice?: number }>({ childAssetId: "", quantity: "1" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [tab, setTab]               = useState<Tab>("paquetes");
  const [showForm, setShowForm]     = useState(false);
  // ── Pricing tiers editor ──────────────────────────────────────────────────
  const [editPricingType,  setEditPricingType]  = useState<"none" | "hourly" | "capacity" | "per_person">("none");
  const [editMinPersons,   setEditMinPersons]   = useState<string>("25");
  const [editTierRows, setEditTierRows]       = useState<{ label: string; amount: string }[]>([]);
  // ── Gallery picker ────────────────────────────────────────────────────────
  const [editImageUrl,   setEditImageUrl]   = useState<string | null>(null);
  const [editGallery,    setEditGallery]    = useState<string[]>([]);
  const [showPicker,     setShowPicker]     = useState(false);
  const [galleryImages,  setGalleryImages]  = useState<{ name: string; webp: string | null; original: string }[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [urlInput,       setUrlInput]       = useState("");
  const [editExtraCatIds, setEditExtraCatIds] = useState<number[]>([]);

  function normalizeDriveUrl(url: string): string {
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch && url.includes("drive.google.com")) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
    return url;
  }

  function addUrlToGallery(raw: string) {
    const url = normalizeDriveUrl(raw.trim());
    if (!url) return;
    if (editGallery.includes(url)) return;
    const ng = [...editGallery, url];
    setEditGallery(ng);
    setEditImageUrl(ng[0] ?? null);
    setUrlInput("");
  }

  // Carga todos los activos y la lista de componentes disponibles para BOM
  const load = useCallback(async () => {
    setLoading(true);
    const [assetsRes, compsRes] = await Promise.all([
      fetch("/api/admin/assets"),
      fetch("/api/admin/assets"), // todos — rentables y componentes pueden ser hijos de BOM
    ]);
    const [assetsJson, compsJson] = await Promise.all([assetsRes.json(), compsRes.json()]);

    const allAssets: Asset[] = assetsJson.data ?? [];
    setAssets(allAssets);

    // Componentes internos de TODOS (para el BOM selector)
    // Para el selector BOM usamos TODOS los assets (rentables y componentes internos)
    const comps: Asset[] = compsJson.data ?? [];
    setAvComps(comps.map((c) => ({
      id: c.id, name: c.displayName,
      pricingTiers: c.pricingTiers ?? null,
      assetType: c.assetType,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Abrir editor de un activo
  const openEdit = async (asset: Asset) => {
    if (editingId === asset.id) {
      setEditingId(null); setEditDetail(null);
      setEditPricingType("none"); setEditTierRows([]);
      return;
    }
    setEditingId(asset.id);
    setEditForm({ name: asset.name, sku: asset.sku, totalUnits: String(asset.totalUnits), dailyRate: String(asset.dailyRate), originalPrice: asset.originalPrice ?? "", maxGuests: String(asset.maxGuests ?? ""), isActive: asset.isActive, isRentable: asset.isRentable, description: asset.description ?? "", assetType: asset.assetType ?? "product", isRecommended: asset.isRecommended ?? false, promoType: asset.promoType ?? "", promoMinValue: String(asset.promoMinValue ?? "") });
    setEditImageUrl(asset.imageUrl ?? null);
    setEditGallery(asset.imageGallery ?? []);
    setShowPicker(false);
    setUrlInput("");
    setEditExtraCatIds(Array.isArray(asset.extraCategoryIds) ? asset.extraCategoryIds : []);
    const res  = await fetch(`/api/admin/assets/${asset.id}`);
    const json = await res.json();
    setEditDetail(json.data);
    // Inicializar editor de tiers desde la BD
    const pt = json.data?.pricingTiers as PricingConfig | null;
    if (pt?.type === "per_person") {
      setEditPricingType("per_person");
      setEditMinPersons(String(pt.minPersons ?? 25));
      setEditTierRows([]);
    } else if (pt?.type && (pt as { type: string; tiers?: unknown[] }).tiers?.length) {
      setEditPricingType(pt.type as "hourly" | "capacity");
      setEditTierRows((pt as { tiers: { label: string; price?: number; qty?: number }[] }).tiers.map((t) => ({
        label:  t.label,
        amount: String(t.price ?? t.qty ?? 0),
      })));
    } else {
      setEditPricingType("none");
      setEditTierRows([]);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    // Componer el JSON de pricing tiers
    const validRows = editTierRows.filter((r) => r.label.trim() && r.amount.trim() && Number(r.amount) > 0);
    const pricingTiers: PricingConfig | null =
      editPricingType === "per_person"
        ? { type: "per_person", minPersons: Math.max(1, Number(editMinPersons) || 25) }
        : editPricingType === "none" || validRows.length === 0
          ? null
          : { type: editPricingType, tiers: validRows.map((r) => ({ label: r.label.trim(), price: Number(r.amount) })) };

    const res = await fetch(`/api/admin/assets/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        totalUnits:    Number(editForm.totalUnits),
        dailyRate:     Number(editForm.dailyRate),
        originalPrice: editForm.originalPrice ? Number(editForm.originalPrice) : null,
        maxGuests:     editForm.maxGuests      ? Number(editForm.maxGuests)     : null,
        isRentable:    Boolean(editForm.isRentable),
        assetType:     String(editForm.assetType ?? "product"),
        description:   String(editForm.description ?? "").trim() || null,
        imageGallery:     editGallery,
        imageUrl:         editGallery[0] ?? null,
        extraCategoryIds: editExtraCatIds,
        pricingTiers,
        isRecommended: Boolean(editForm.isRecommended),
        promoType:     editForm.promoType     || null,
        promoMinValue: editForm.promoMinValue ? Number(editForm.promoMinValue) : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setMsg({ type: "err", text: json.error }); }
    else {
      setAssets((prev) => prev.map((a) => a.id === editingId ? { ...a, ...json.data } : a));
      setMsg({ type: "ok", text: `'${json.data.displayName}' actualizado.` });
      setEditingId(null); setEditDetail(null);
      await load(); // recarga para actualizar componentes disponibles si cambió algo
    }
    setSavingEdit(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: Number(form.categoryId), totalUnits: Number(form.totalUnits), dailyRate: Number(form.dailyRate), assetType: form.assetType }),
    });
    const json = await res.json();
    if (!res.ok) { setMsg({ type: "err", text: json.error }); }
    else {
      setMsg({ type: "ok", text: `'${json.data.displayName}' creado correctamente.` });
      setForm(emptyForm);
      setShowForm(false);
      await load();
      const t = json.data.assetType;
      setTab(t === "package" ? "paquetes" : t === "product" ? "productos" : "componentes");
    }
    setSaving(false);
  };

  const addComponent = async (assetId: number) => {
    if (!newComp.childAssetId) return;
    await fetch(`/api/admin/assets/${assetId}/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childAssetId:  Number(newComp.childAssetId),
        quantity:      Number(newComp.quantity),
        ...(newComp.overridePrice != null && { overridePrice: newComp.overridePrice }),
      }),
    });
    setNewComp({ childAssetId: "", quantity: "1", overridePrice: undefined });
    await load();
    if (editingId === assetId || editBomId === assetId) {
      const r = await fetch(`/api/admin/assets/${assetId}`);
      setEditDetail((await r.json()).data);
    }
  };

  const removeComponent = async (assetId: number, childId: number, childName?: string) => {
    if (!confirm(`¿Quitar "${childName ?? "este componente"}" del BOM?\nEl componente no se elimina, solo se desvincula del paquete.`)) return;
    await fetch(`/api/admin/assets/${assetId}/components`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childAssetId: childId }),
    });
    await load();
    if (editingId === assetId || editBomId === assetId) {
      const r = await fetch(`/api/admin/assets/${assetId}`);
      setEditDetail((await r.json()).data);
    }
  };

  const deleteAsset = async (asset: Asset) => {
    const tipo = asset.assetType === "package" ? "paquete" : asset.assetType === "component" ? "componente" : "producto";
    if (!confirm(`¿Eliminar ${tipo} "${asset.name}"?\nEsta acción lo desactivará permanentemente y no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/assets/${asset.id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "ok", text: `"${asset.name}" eliminado correctamente.` });
      if (editingId === asset.id) setEditingId(null);
      if (editBomId === asset.id) setEditBomId(null);
      await load();
    } else {
      const json = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: json.error ?? "No se pudo eliminar el activo." });
    }
  };

  const myPaquetes   = assets.filter((a) => a.assetType === "package"   && a.ownerSuffix === userSuffix);
  const myProductos  = assets.filter((a) => a.assetType === "product"   && a.ownerSuffix === userSuffix);
  const myComponents = assets.filter((a) => a.assetType === "component" && a.ownerSuffix === userSuffix);
  const others       = assets.filter((a) => a.ownerSuffix !== userSuffix);

  const tabAssets: Record<Tab, Asset[]> = {
    paquetes:    myPaquetes,
    productos:   myProductos,
    componentes: myComponents,
    otros:       others,
  };
  const shown = tabAssets[tab];

  const TABS: { key: Tab; label: string; count: number; color: string }[] = [
    { key: "paquetes",    label: `Mis paquetes [${userSuffix ?? "?"}]`,  count: myPaquetes.length,   color: "var(--gold)" },
    { key: "productos",   label: "Mis productos individuales",            count: myProductos.length,  color: "#38bdf8"     },
    { key: "componentes", label: "Mis componentes internos",              count: myComponents.length, color: "#7C3AED"     },
    { key: "otros",       label: "De otros admins",                       count: others.length,       color: "#94A3B8"     },
  ];

  return (
    <div className="space-y-8">
      {/* ── BOTÓN ABRIR FORMULARIO ── */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 border-dashed"
          style={{ borderColor: "rgba(232,25,138,.4)", color: "var(--gold)", background: "rgba(232,25,138,.05)" }}>
          ＋ Nuevo producto / paquete
        </button>
      )}

      {/* ── FORMULARIO CREAR (colapsable) ── */}
      {showForm && (
      <form onSubmit={handleCreate} className="aura-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Nuevo activo</p>
          <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setMsg(null); }}
            className="text-sm font-bold" style={{ color: "#475569" }}>✕ Cancelar</button>
        </div>

        {/* Selector 3-vías de tipo */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,.04)" }}>
          {[
            { key: "package",   label: "📦 Paquete",         color: "var(--gold)", tc: "#05051a" },
            { key: "product",   label: "🎭 Producto",         color: "#38bdf8",    tc: "#05051a" },
            { key: "component", label: "🔧 Componente",       color: "#7C3AED",    tc: "#fff"    },
          ].map((t) => (
            <button key={t.key} type="button"
              onClick={() => setForm((f) => ({ ...f, assetType: t.key, isRentable: t.key !== "component" }))}
              className="flex-1 py-2.5 rounded-lg text-xs font-black transition-all"
              style={{
                background: form.assetType === t.key ? t.color : "transparent",
                color:      form.assetType === t.key ? t.tc    : "#94A3B8",
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl px-4 py-2 text-xs" style={{ background: "rgba(255,255,255,.03)", color: "#94A3B8" }}>
          {form.assetType === "package"   && "Bundle completo con varios servicios. Incluye 5 hrs de servicio. Aparece en catálogo."}
          {form.assetType === "product"   && "Servicio individual (Cabina, Maruchan). Rentable solo O dentro de paquetes. Aparece en catálogo."}
          {form.assetType === "component" && "Equipo interno (cables, luces, bases). NO aparece en catálogo. Solo dentro de paquetes BOM."}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Categoría</label>
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} required className="aura-select">
              <option value="">— Seleccionar —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Nombre</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              placeholder={form.isRentable ? "Paquete Premium" : "Cable XLR 10m"} className="aura-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>SKU</label>
            <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} required
              placeholder={form.isRentable ? "PKG-PREM-01" : "COMP-CABLE-XLR"} className="aura-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Unidades disponibles</label>
            <input type="number" min={1} value={form.totalUnits}
              onChange={(e) => setForm((f) => ({ ...f, totalUnits: e.target.value }))} className="aura-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>
              Precio MXN {!form.isRentable && <span style={{ color: "#475569" }}>(puede ser $0)</span>}
            </label>
            <input type="number" min={0} value={form.dailyRate}
              onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))} className="aura-input" />
          </div>
        </div>

        {msg && <p className="text-sm font-bold" style={{ color: msg.type === "ok" ? "#22c55e" : "#EF4444" }}>{msg.text}</p>}

        <button type="submit" disabled={saving} className="font-black px-6 py-2.5 rounded-lg text-sm disabled:opacity-50"
          style={{ background: form.assetType === "component" ? "#7C3AED" : "var(--gold)", color: form.assetType === "component" ? "#fff" : "#05051a" }}>
          {saving ? "Guardando..." : `+ Crear ${form.assetType === "package" ? "paquete" : form.assetType === "product" ? "producto" : "componente"}`}
        </button>
      </form>
      )}

      {/* ── TABS ── */}
      <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,.04)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 min-w-[120px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
            style={{
              background: tab === t.key ? t.color : "transparent",
              color:      tab === t.key ? (t.key === "paquetes" ? "#05051a" : "#fff") : "#94A3B8",
            }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Descripción de la tab activa */}
      {tab === "componentes" && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.2)", color: "#94A3B8" }}>
          🔧 Los componentes no aparecen en el catálogo. Se agregan al BOM de un paquete o producto
          y se bloquean automáticamente al reservar.
        </div>
      )}
      {tab === "productos" && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(56,189,248,.06)", border: "1px solid rgba(56,189,248,.2)", color: "#94A3B8" }}>
          🎭 Los productos individuales aparecen en el catálogo. También puedes agregarlos al BOM de
          un paquete — si el paquete se reserva, el producto queda bloqueado automáticamente en esa fecha.
        </div>
      )}

      {loading && <p className="text-sm" style={{ color: "#94A3B8" }}>Cargando...</p>}

      {!loading && shown.length === 0 && (
        <div className="aura-card p-10 text-center" style={{ color: "#475569" }}>
          {tab === "paquetes"    ? 'Sin paquetes. Crea uno arriba seleccionando "Paquete".' :
           tab === "productos"   ? 'Sin productos individuales. Crea uno seleccionando "Producto".' :
           tab === "componentes" ? 'Sin componentes. Crea uno seleccionando "Componente".' :
           "No hay activos de otros admins."}
        </div>
      )}

      {/* ── LISTA ── */}
      <div className="space-y-3">
        {shown.map((asset) => {
          const isEditOpen = editingId === asset.id;
          const isBomOpen  = editBomId === asset.id && !isEditOpen;
          const detail     = isEditOpen ? editDetail : null;
          const compTotal  = detail?.componentTotal ?? asset.components.reduce((s, c) => s + Number(c.childAsset.dailyRate) * c.quantity, 0);
          const savings    = Math.max(0, compTotal - Number(isEditOpen ? (editForm.dailyRate ?? asset.dailyRate) : asset.dailyRate));
          const savingsPct = compTotal > 0 ? Math.round((savings / compTotal) * 100) : 0;

          return (
            <div key={asset.id} className="aura-card overflow-hidden">
              {/* Fila principal */}
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs"
                  style={{ background: asset.isRentable ? "rgba(212,175,55,.2)" : "rgba(124,58,237,.2)", color: asset.isRentable ? "var(--gold)" : "#9333EA" }}>
                  {asset.ownerSuffix ?? "—"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-black text-white">{asset.displayName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,.12)", color: "#9333EA" }}>
                      {asset.category.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: asset.isRentable ? "rgba(212,175,55,.12)" : "rgba(124,58,237,.15)", color: asset.isRentable ? "var(--gold)" : "#9333EA" }}>
                      {asset.isRentable ? "Rentable" : "🔧 Componente"}
                    </span>
                    {!asset.isActive && <span className="text-xs font-bold" style={{ color: "#EF4444" }}>Inactivo</span>}
                  </div>
                  <p className="text-sm" style={{ color: "#94A3B8" }}>
                    SKU: {asset.sku} · {asset.totalUnits} ud ·{" "}
                    {asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate) && (
                      <span style={{ textDecoration: "line-through", color: "#6b7280", marginRight: "0.3rem" }}>
                        ${Number(asset.originalPrice).toLocaleString("es-MX")}
                      </span>
                    )}
                    <span className="font-black" style={{ color: asset.originalPrice ? "#f87171" : "var(--gold)" }}>
                      {Number(asset.dailyRate) > 0 ? `$${Number(asset.dailyRate).toLocaleString("es-MX")} MXN` : "Sin precio independiente"}
                    </span>
                    {asset.originalPrice && Number(asset.originalPrice) > Number(asset.dailyRate) && (
                      <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: 999, background: "rgba(220,38,38,0.15)", color: "#fca5a5" }}>OFERTA</span>
                    )}
                  </p>
                  {asset.components.length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                      {asset.components.length} componente{asset.components.length !== 1 ? "s" : ""} en BOM
                      {compTotal > 0 && ` · suma $${compTotal.toLocaleString("es-MX")} MXN`}
                      {savings > 0 && <span style={{ color: "#22c55e" }}> · ahorro ${savings.toLocaleString("es-MX")} ({savingsPct}%)</span>}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(asset)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: isEditOpen ? "var(--gold)" : "rgba(212,175,55,.3)", color: "var(--gold)", background: isEditOpen ? "rgba(212,175,55,.1)" : "transparent" }}>
                    {isEditOpen ? "✕ Cerrar" : "✎ Editar"}
                  </button>
                  {asset.isRentable && (
                    <button onClick={() => setEditBomId(isBomOpen ? null : asset.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: isBomOpen ? "#7C3AED" : "rgba(124,58,237,.3)", color: "#9333EA", background: isBomOpen ? "rgba(124,58,237,.1)" : "transparent" }}>
                      {isBomOpen ? "✕ BOM" : "⚙ BOM"}
                    </button>
                  )}
                  <button onClick={() => deleteAsset(asset)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: "rgba(239,68,68,.3)", color: "#EF4444", background: "transparent" }}>
                    🗑 Eliminar
                  </button>
                </div>
              </div>

              {/* ── EDITOR DE CAMPOS ── */}
              {isEditOpen && (
                <div className="px-5 pb-5 pt-3 border-t space-y-4" style={{ borderColor: "rgba(212,175,55,.15)", background: "rgba(212,175,55,.03)" }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>Editar</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Nombre",    key: "name",          type: "text",   ph: "",    alwaysShow: true  },
                      { label: "SKU",       key: "sku",           type: "text",   ph: "",    alwaysShow: true  },
                      { label: "Unidades",  key: "totalUnits",    type: "number", ph: "",    alwaysShow: true  },
                      { label: `Precio MXN${!asset.isRentable ? " (puede ser $0)" : ""}`, key: "dailyRate",     type: "number", ph: "",                           alwaysShow: false },
                      { label: "Precio original (tachado, opcional)",               key: "originalPrice", type: "number", ph: "Dejar vacío si no hay oferta", alwaysShow: false },
                      { label: "Máx. invitados (capacidad)",                        key: "maxGuests",     type: "number", ph: "Ej: 200",                      alwaysShow: false },
                    ]
                    .filter(({ alwaysShow }) => alwaysShow || editPricingType === "none")
                    .map(({ label, key, type, ph }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>{label}</label>
                        <input type={type} min={type === "number" ? 0 : undefined}
                          value={String(editForm[key] ?? "")}
                          placeholder={ph}
                          onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="aura-input" />
                      </div>
                    ))}
                    <div className="flex flex-col gap-3">
                      {/* Toggle rentable/componente */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>
                          Tipo de producto
                        </label>
                        {/* Selector 3-vías de tipo */}
                        {(() => {
                          const curType = String(editForm.assetType ?? asset.assetType ?? "product");
                          const types = [
                            { key: "package",   label: "📦 Paquete",   color: "var(--gold)", textColor: "#05051a",
                              hint: "Bundle completo (DJ+Audio+etc). Incluye 5 hrs de servicio." },
                            { key: "product",   label: "🎭 Producto",   color: "#38bdf8", textColor: "#05051a",
                              hint: "Servicio individual. Se renta solo O como parte de un paquete." },
                            { key: "component", label: "🔧 Componente", color: "#7C3AED", textColor: "#fff",
                              hint: "Equipo interno. No se renta solo, solo dentro de paquetes." },
                          ];
                          const active = types.find((t) => t.key === curType) ?? types[1];
                          return (
                            <>
                              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "rgba(255,255,255,.1)" }}>
                                {types.map((t) => (
                                  <button key={t.key} type="button"
                                    onClick={() => setEditForm((f) => ({ ...f, assetType: t.key, isRentable: t.key !== "component" }))}
                                    className="flex-1 py-2 text-xs font-black transition-all"
                                    style={{
                                      background: curType === t.key ? t.color : "transparent",
                                      color:      curType === t.key ? t.textColor : "#94A3B8",
                                    }}>
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs mt-1" style={{ color: "#475569" }}>{active.hint}</p>
                            </>
                          );
                        })()}
                      </div>

                      {/* Checkbox activo */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={Boolean(editForm.isActive ?? asset.isActive)}
                          onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                          className="w-4 h-4 accent-[#7C3AED]" />
                        <span className="text-sm text-white">Activo (visible)</span>
                      </label>
                    </div>
                  </div>

                  {/* ── CATEGORÍAS ── */}
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)" }}>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#94A3B8" }}>Categorías</p>

                    {/* Categoría principal */}
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Principal *</label>
                      <select
                        value={String(editForm.categoryId ?? asset.categoryId)}
                        onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.target.value }))}
                        className="aura-input"
                        style={{ fontSize: "0.85rem" }}>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Categorías adicionales */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: "#64748b" }}>
                        Adicionales <span style={{ fontWeight: 400 }}>(el producto aparece en todas)</span>
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {categories
                          .filter((c) => c.id !== Number(editForm.categoryId ?? asset.categoryId))
                          .map((c) => {
                            const checked = editExtraCatIds.includes(c.id);
                            return (
                              <label key={c.id}
                                style={{
                                  display: "flex", alignItems: "center", gap: "0.4rem",
                                  padding: "0.3rem 0.7rem", borderRadius: 999, cursor: "pointer",
                                  border: `1px solid ${checked ? "rgba(124,58,237,.6)" : "rgba(255,255,255,.1)"}`,
                                  background: checked ? "rgba(124,58,237,.2)" : "transparent",
                                  fontSize: "0.78rem", color: checked ? "#c4b5fd" : "#64748b",
                                  transition: "all 0.15s",
                                }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setEditExtraCatIds((prev) =>
                                      e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                                    );
                                  }}
                                  style={{ accentColor: "#7C3AED", width: 13, height: 13 }}
                                />
                                {c.name}
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* ── DESCRIPCIÓN ── */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>
                      Descripción <span style={{ color: "#475569", textTransform: "none", fontWeight: 400 }}>(aparece en las tarjetas del catálogo)</span>
                    </label>
                    <textarea
                      rows={4}
                      value={String(editForm.description ?? "")}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe qué incluye este paquete o servicio. Cada línea aparece como un punto en la tarjeta."
                      className="aura-input"
                      style={{ resize: "vertical", lineHeight: 1.6 }}
                    />
                    <p className="text-xs mt-1" style={{ color: "#334155" }}>
                      Cada línea del texto = un punto en la tarjeta. Los componentes del BOM se muestran automáticamente después.
                    </p>
                  </div>

                  {/* ── GALERÍA DE IMÁGENES (carrusel) ── */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>
                      Fotos del producto
                      <span className="ml-2 normal-case font-normal" style={{ color: "#334155" }}>
                        — se muestran como carrusel en la tarjeta
                      </span>
                    </label>

                    {/* Fotos seleccionadas (carrusel del producto) */}
                    {editGallery.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        {editGallery.map((url, idx) => (
                          <div key={url} style={{ position: "relative", width: 86, height: 68, borderRadius: 8, overflow: "hidden",
                            border: idx === 0 ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,.1)" }}>
                            <img src={url} alt={`Foto ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {idx === 0 && (
                              <span style={{ position: "absolute", bottom: 2, left: 2, fontSize: "0.5rem",
                                background: "var(--gold)", color: "#05051a", fontWeight: 700,
                                padding: "0.1rem 0.3rem", borderRadius: 3 }}>
                                Principal
                              </span>
                            )}
                            {/* Quitar del carrusel */}
                            <button type="button"
                              onClick={() => {
                                const ng = editGallery.filter((u) => u !== url);
                                setEditGallery(ng);
                                setEditImageUrl(ng[0] ?? null);
                              }}
                              style={{
                                position: "absolute", top: 2, right: 2,
                                width: 18, height: 18, borderRadius: "50%",
                                background: "rgba(239,68,68,.85)", color: "#fff",
                                fontSize: "0.6rem", fontWeight: 700, border: "none",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {editGallery.length === 0 && (
                      <p style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.75rem" }}>
                        Sin fotos asignadas. Usa el selector para escoger de la Galería.
                      </p>
                    )}

                    {/* Pegar URL directa (Google Drive, Cloudinary, etc.) */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrlToGallery(urlInput); } }}
                        placeholder="Pega URL de Drive o imagen directa"
                        className="aura-input"
                        style={{ flex: 1, fontSize: "0.78rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => addUrlToGallery(urlInput)}
                        className="btn-ghost"
                        style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        + Agregar
                      </button>
                    </div>

                    {/* Botón abrir picker */}
                    <button type="button"
                      onClick={async () => {
                        setShowPicker((v) => !v);
                        if (!showPicker && galleryImages.length === 0) {
                          setLoadingGallery(true);
                          const res  = await fetch("/api/admin/galeria");
                          const json = await res.json();
                          setGalleryImages(json.data ?? []);
                          setLoadingGallery(false);
                        }
                      }}
                      className="btn-ghost"
                      style={{ fontSize: "0.78rem", marginBottom: "0.75rem" }}>
                      🖼️ {showPicker ? "Cerrar galería" : "Seleccionar fotos de Galería"}
                    </button>

                    {/* Picker de galería */}
                    {showPicker && (
                      <div style={{ border: "1px solid rgba(124,58,237,.25)", borderRadius: 12,
                        padding: "1rem", background: "rgba(124,58,237,.04)" }}>
                        <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
                          Haz clic en una imagen para agregarla o quitarla del carrusel.
                          La primera de la lista = imagen principal del producto.
                        </p>
                        {loadingGallery && (
                          <p style={{ color: "#475569", fontSize: "0.8rem" }}>Cargando galería...</p>
                        )}
                        {!loadingGallery && galleryImages.length === 0 && (
                          <p style={{ color: "#475569", fontSize: "0.8rem" }}>
                            La galería está vacía. Sube imágenes en{" "}
                            <a href="/admin/galeria" target="_blank" style={{ color: "var(--gold)" }}>
                              /admin/galeria
                            </a>.
                          </p>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", maxHeight: 320, overflowY: "auto" }}>
                          {galleryImages.map((img) => {
                            const src      = img.webp ?? img.original;
                            const selected = editGallery.includes(src);
                            return (
                              <div key={img.name}
                                onClick={() => {
                                  if (selected) {
                                    const ng = editGallery.filter((u) => u !== src);
                                    setEditGallery(ng);
                                    setEditImageUrl(ng[0] ?? null);
                                  } else {
                                    const ng = [...editGallery, src];
                                    setEditGallery(ng);
                                    setEditImageUrl(ng[0] ?? null);
                                  }
                                }}
                                style={{
                                  position: "relative", width: 90, height: 72, borderRadius: 8,
                                  overflow: "hidden", cursor: "pointer",
                                  border: selected ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,.1)",
                                  boxShadow: selected ? "0 0 0 1px var(--gold)" : "none",
                                  transition: "border 0.15s, box-shadow 0.15s",
                                }}>
                                <img src={src} alt={img.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                {selected && (
                                  <div style={{
                                    position: "absolute", inset: 0,
                                    background: "rgba(232,25,138,.25)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <span style={{ fontSize: "1.4rem", color: "var(--gold)", fontWeight: 900 }}>✓</span>
                                  </div>
                                )}
                                {/* Número de orden si está seleccionada */}
                                {selected && (
                                  <span style={{
                                    position: "absolute", top: 3, left: 4,
                                    fontSize: "0.6rem", fontWeight: 900,
                                    background: "var(--gold)", color: "#05051a",
                                    width: 16, height: 16, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    {editGallery.indexOf(src) + 1}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p style={{ fontSize: "0.68rem", color: "#334155", marginTop: "0.5rem" }}>
                      El orden de las fotos en el carrusel = orden en que las seleccionaste.
                      Para reordenar: quita y vuelve a agregar.
                    </p>
                  </div>

                  {/* ── PRICING TIERS ── */}
                  {Boolean(editForm.isRentable ?? asset.isRentable) && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.2)" }}>
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>⚙ Tipo de precio</p>
                      {/* Selector de tipo */}
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {(["none", "hourly", "capacity", "per_person"] as const).map((t) => {
                          const labels = { none: "Precio único", hourly: "Por hora", capacity: "Por capacidad", per_person: "Por persona" };
                          const active = editPricingType === t;
                          return (
                            <button key={t} type="button"
                              onClick={() => {
                                setEditPricingType(t);
                                if (t !== "none" && editTierRows.length === 0) {
                                  setEditTierRows([{ label: "", amount: "" }]);
                                }
                              }}
                              style={{
                                padding: "0.4rem 1rem", borderRadius: 999,
                                border: `1px solid ${active ? "#7C3AED" : "rgba(124,58,237,.3)"}`,
                                background: active ? "rgba(124,58,237,.3)" : "transparent",
                                color: active ? "#fff" : "#94a3b8",
                                fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                              }}>
                              {labels[t]}
                            </button>
                          );
                        })}
                      </div>

                      {/* Precio por persona */}
                      {editPricingType === "per_person" && (
                        <div style={{ background: "rgba(124,58,237,.08)", borderRadius: 10, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {/* Precio unitario */}
                          <div>
                            <label htmlFor="price-per-person" className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: "#9333EA" }}>
                              Precio por persona (MXN) *
                            </label>
                            <div className="flex items-center gap-2">
                              <span style={{ color: "#64748b", fontWeight: 700 }}>$</span>
                              <input
                                id="price-per-person"
                                type="number" min={0}
                                value={editForm.dailyRate as string ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, dailyRate: e.target.value }))}
                                placeholder="ej: 50"
                                className="aura-input"
                                style={{ maxWidth: 140 }}
                              />
                              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>MXN / persona</span>
                            </div>
                          </div>
                          {/* Mínimo de personas */}
                          <div>
                            <label htmlFor="min-persons" className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: "#9333EA" }}>
                              Mínimo de personas
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id="min-persons"
                                type="number" min={1}
                                value={editMinPersons}
                                onChange={(e) => setEditMinPersons(e.target.value)}
                                className="aura-input"
                                style={{ maxWidth: 100 }}
                              />
                              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>personas (default: 25)</span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                              El calculador y el wizard de reservas arrancan desde este mínimo.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Editor de filas */}
                      {editPricingType !== "none" && editPricingType !== "per_person" && (
                        <div className="space-y-2">
                          <p className="text-xs" style={{ color: "#475569" }}>
                            {editPricingType === "hourly"
                              ? "Define cada opción de horas con su precio."
                              : "Define cada capacidad con su multiplicador (1 = precio base × 1)."}
                          </p>
                          {editTierRows.map((row, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <input
                                value={row.label}
                                onChange={(e) => setEditTierRows((rows) => rows.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                                placeholder={editPricingType === "hourly" ? "ej: 2 horas" : "ej: 100 personas"}
                                className="aura-input"
                                style={{ flex: 2 }}
                              />
                              <input
                                type="number" min={0}
                                value={row.amount}
                                onChange={(e) => setEditTierRows((rows) => rows.map((r, i) => i === idx ? { ...r, amount: e.target.value } : r))}
                                placeholder={editPricingType === "hourly" ? "Precio MXN" : "Cantidad (1,2,3...)"}
                                className="aura-input"
                                style={{ flex: 1 }}
                              />
                              <button type="button"
                                onClick={() => setEditTierRows((rows) => rows.filter((_, i) => i !== idx))}
                                style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.25rem 0.5rem" }}>
                                ✕
                              </button>
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => setEditTierRows((rows) => [...rows, { label: "", amount: "" }])}
                            style={{ fontSize: "0.78rem", color: "#7C3AED", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "0.25rem 0" }}>
                            + Agregar opción
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resumen ahorro — solo si tiene componentes */}
                  {compTotal > 0 && (
                    <div className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                      style={{ background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.2)" }}>
                      <div className="space-y-1 text-sm">
                        <p style={{ color: "#94A3B8" }}>
                          Suma de componentes:{" "}
                          <span className="font-black text-white">${compTotal.toLocaleString("es-MX")} MXN</span>
                        </p>
                        <p style={{ color: "#94A3B8" }}>
                          Precio del paquete:{" "}
                          <span className="font-black" style={{ color: "var(--gold)" }}>
                            ${Number(editForm.dailyRate ?? asset.dailyRate).toLocaleString("es-MX")} MXN
                          </span>
                        </p>
                      </div>
                      {savings > 0 ? (
                        <div className="text-center">
                          <p className="text-2xl font-black" style={{ color: "#22c55e" }}>${savings.toLocaleString("es-MX")}</p>
                          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#22c55e" }}>ahorro · {savingsPct}%</p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold" style={{ color: "#EF4444" }}>
                          ⚠ Precio mayor que suma de componentes
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Sección Promoción ── */}
                  <div className="pt-4 border-t space-y-3" style={{ borderColor: "rgba(212,175,55,.15)" }}>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--gold)" }}>🏷 Promoción / Recomendado</p>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={Boolean(editForm.isRecommended)}
                        onChange={(e) => setEditForm((f) => ({ ...f, isRecommended: e.target.checked, promoType: e.target.checked ? (f.promoType || "fixed") : "" }))}
                        className="w-4 h-4 accent-[#FF3DA8]" />
                      <span className="text-sm text-white">Mostrar como recomendado en el flujo de reserva</span>
                    </label>

                    {Boolean(editForm.isRecommended) && (
                      <div className="space-y-3 pl-6">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest block mb-1" style={{ color: "#94A3B8" }}>Tipo de promoción</label>
                          <div className="flex gap-2 flex-wrap">
                            {(["fixed", "guests", "hours"] as const).map((t) => (
                              <button key={t} type="button"
                                onClick={() => setEditForm((f) => ({ ...f, promoType: t }))}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                                style={{
                                  borderColor: editForm.promoType === t ? "var(--gold)" : "rgba(212,175,55,.25)",
                                  background:  editForm.promoType === t ? "rgba(212,175,55,.12)" : "transparent",
                                  color:       editForm.promoType === t ? "var(--gold)" : "#94A3B8",
                                }}>
                                {t === "fixed" ? "💰 Precio fijo" : t === "guests" ? "👥 Por invitados" : "⏱ Por horas"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {(editForm.promoType === "guests" || editForm.promoType === "hours") && (
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest block mb-1" style={{ color: "#94A3B8" }}>
                              {editForm.promoType === "guests" ? "Mínimo de invitados" : "Número de horas incluidas"}
                            </label>
                            <input type="number" min="1"
                              value={String(editForm.promoMinValue ?? "")}
                              onChange={(e) => setEditForm((f) => ({ ...f, promoMinValue: e.target.value }))}
                              placeholder={editForm.promoType === "guests" ? "ej. 100" : "ej. 3"}
                              className="aura-input" style={{ maxWidth: 140 }} />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest block mb-1" style={{ color: "#94A3B8" }}>Precio promo (MXN)</label>
                            <input type="number" min="0"
                              value={String(editForm.dailyRate ?? "")}
                              onChange={(e) => setEditForm((f) => ({ ...f, dailyRate: e.target.value }))}
                              className="aura-input" />
                            <p className="text-xs mt-1" style={{ color: "#475569" }}>Este es el precio que verá el cliente</p>
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest block mb-1" style={{ color: "#94A3B8" }}>Precio original (tachado)</label>
                            <input type="number" min="0"
                              value={String(editForm.originalPrice ?? "")}
                              onChange={(e) => setEditForm((f) => ({ ...f, originalPrice: e.target.value }))}
                              placeholder="Dejar vacío si no aplica"
                              className="aura-input" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={saveEdit} disabled={savingEdit}
                      className="font-black px-5 py-2.5 rounded-lg text-sm disabled:opacity-50"
                      style={{ background: "var(--gold)", color: "#05051a" }}>
                      {savingEdit ? "Guardando..." : "Guardar cambios"}
                    </button>
                    <button onClick={() => { setEditingId(null); setEditDetail(null); setShowPicker(false); }}
                      className="text-sm px-4 py-2 rounded-lg border"
                      style={{ borderColor: "rgba(255,255,255,.1)", color: "#94A3B8" }}>
                      Cancelar
                    </button>
                  </div>

                  {/* ── BOM INTEGRADO EN EDITOR (para paquetes y productos) ── */}
                  {(String(editForm.assetType ?? asset.assetType) !== "component") && (
                    <div style={{ borderTop: "1px solid rgba(124,58,237,.2)", paddingTop: "1.25rem" }}>
                      <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#7C3AED" }}>
                        ✦ Productos / Componentes incluidos
                        <span className="ml-2 normal-case font-normal" style={{ color: "#475569" }}>
                          — se bloquean automáticamente al reservar este{" "}
                          {String(editForm.assetType ?? asset.assetType) === "package" ? "paquete" : "producto"}
                        </span>
                      </p>

                      {/* Lista de items BOM actuales */}
                      {asset.components.length === 0 && (
                        <p className="text-sm mb-3" style={{ color: "#475569" }}>
                          Sin items aún. Agrega productos o componentes abajo.
                        </p>
                      )}
                      {asset.components.map((c) => {
                        const effectivePrice = c.overridePrice != null
                          ? Number(c.overridePrice)
                          : Number(c.childAsset.dailyRate) * c.quantity;
                        return (
                          <div key={c.childAssetId} className="flex items-center gap-3 py-2 border-b text-sm"
                            style={{ borderColor: "rgba(124,58,237,.1)" }}>
                            <div className="flex-1 min-w-0">
                              <span className="text-white font-bold">
                                {c.childAsset.ownerSuffix ? `${c.childAsset.name} [${c.childAsset.ownerSuffix}]` : c.childAsset.name}
                              </span>
                              <span className="ml-2" style={{ color: "#94A3B8" }}>
                                ×{c.quantity}
                                {c.overridePrice != null && (
                                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,.2)", color: "#a78bfa" }}>
                                    precio fijo
                                  </span>
                                )}
                                {effectivePrice > 0 && (
                                  <span style={{ color: "var(--gold)", marginLeft: "0.4rem" }}>
                                    ${effectivePrice.toLocaleString("es-MX")} MXN
                                  </span>
                                )}
                              </span>
                            </div>
                            <button onClick={() => removeComponent(asset.id, c.childAssetId, c.childAsset.name)}
                              className="text-xs font-bold px-2 py-1 rounded"
                              style={{ background: "rgba(239,68,68,.12)", color: "#EF4444" }}>
                              ✕
                            </button>
                          </div>
                        );
                      })}

                      {/* Selector agregar con soporte de tiers */}
                      {(() => {
                        const selComp = avComps.find((c) => String(c.id) === newComp.childAssetId);
                        const tierConfig: PricingConfig | null = selComp
                          ? getPricingTiers(selComp.name, selComp.pricingTiers ?? null)
                          : null;
                        return (
                          <div className="space-y-2 mt-3">
                            <div className="flex gap-2 flex-wrap">
                              <select value={newComp.childAssetId}
                                onChange={(e) => setNewComp({ childAssetId: e.target.value, quantity: "1", overridePrice: undefined })}
                                className="aura-select flex-1 min-w-[200px]">
                                <option value="">— Agregar producto o componente —</option>
                                {avComps
                                  .filter((c) => c.id !== asset.id && !asset.components.some((ec) => ec.childAssetId === c.id))
                                  .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              {/* Cantidad solo si no tiene tiers */}
                              {!tierConfig && (
                                <input type="number" min={1} value={newComp.quantity}
                                  onChange={(e) => setNewComp((f) => ({ ...f, quantity: e.target.value }))}
                                  className="aura-input text-center" style={{ width: 70 }} />
                              )}
                              <button type="button" onClick={() => addComponent(asset.id)}
                                disabled={!newComp.childAssetId || (!!tierConfig && newComp.overridePrice == null)}
                                className="font-black px-4 py-2 rounded-lg text-sm disabled:opacity-40"
                                style={{ background: "#7C3AED", color: "#fff" }}>
                                + Agregar
                              </button>
                            </div>

                            {/* Selector de tier si el producto lo tiene (no aplica a per_person) */}
                            {tierConfig && tierConfig.type !== "per_person" && (
                              <div style={{ padding: "0.75rem", borderRadius: 10, background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.2)" }}>
                                <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 700 }}>
                                  {tierConfig.type === "hourly" ? "¿Cuántas horas incluye el paquete?" : "¿Para cuántas personas?"}
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                  {tierConfig.tiers.map((tier) => {
                                    const active = newComp.overridePrice === tier.price;
                                    return (
                                      <button key={tier.label} type="button"
                                        onClick={() => setNewComp((f) => ({ ...f, overridePrice: tier.price, quantity: "1" }))}
                                        style={{
                                          padding: "0.4rem 0.85rem", borderRadius: 8,
                                          border: `1px solid ${active ? "#7C3AED" : "rgba(124,58,237,.3)"}`,
                                          background: active ? "rgba(124,58,237,.35)" : "rgba(124,58,237,.08)",
                                          color: active ? "#fff" : "#94a3b8",
                                          fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                                        }}>
                                        {tier.label}
                                        {tier.price > 0 && (
                                          <span style={{ marginLeft: "0.35rem", opacity: 0.8 }}>
                                            ${tier.price.toLocaleString("es-MX")}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                {newComp.overridePrice == null && (
                                  <p style={{ fontSize: "0.65rem", color: "#EF4444", marginTop: "0.35rem" }}>
                                    Selecciona una opción antes de agregar
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* ── EDITOR BOM independiente (botón externo, fuera del editor) ── */}
              {isBomOpen && asset.isRentable && !isEditOpen && (
                <div className="px-5 pb-5 pt-3 border-t space-y-3" style={{ borderColor: "rgba(124,58,237,.15)", background: "rgba(124,58,237,.04)" }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#7C3AED" }}>Componentes del paquete</p>

                  {asset.components.length === 0 && (
                    <p className="text-sm" style={{ color: "#475569" }}>Sin componentes todavía. Agrega componentes internos abajo.</p>
                  )}

                  {asset.components.map((c) => (
                    <div key={c.childAssetId} className="flex items-center gap-3 py-2 border-b text-sm"
                      style={{ borderColor: "rgba(124,58,237,.1)" }}>
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-bold">
                          {c.childAsset.ownerSuffix ? `${c.childAsset.name} [${c.childAsset.ownerSuffix}]` : c.childAsset.name}
                        </span>
                        <span className="ml-2" style={{ color: "#94A3B8" }}>
                          ×{c.quantity}
                          {Number(c.childAsset.dailyRate) > 0 && ` · $${(Number(c.childAsset.dailyRate) * c.quantity).toLocaleString("es-MX")} MXN`}
                        </span>
                      </div>
                      <button onClick={() => removeComponent(asset.id, c.childAssetId, c.childAsset.name)}
                        className="text-xs font-bold px-2 py-1 rounded"
                        style={{ background: "rgba(239,68,68,.12)", color: "#EF4444" }}>
                        ✕
                      </button>
                    </div>
                  ))}

                  {asset.components.length > 0 && (
                    <p className="text-sm text-right" style={{ color: "#475569" }}>
                      Subtotal:{" "}
                      <span className="font-black" style={{ color: "var(--gold)" }}>
                        ${asset.components.reduce((s, c) => s + Number(c.childAsset.dailyRate) * c.quantity, 0).toLocaleString("es-MX")} MXN
                      </span>
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <select value={newComp.childAssetId}
                      onChange={(e) => setNewComp((f) => ({ ...f, childAssetId: e.target.value }))}
                      className="aura-select flex-1 min-w-[180px]">
                      <option value="">— Seleccionar componente —</option>
                      {avComps
                        .filter((c) => !asset.components.some((ec) => ec.childAssetId === c.id))
                        .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="number" min={1} value={newComp.quantity}
                      onChange={(e) => setNewComp((f) => ({ ...f, quantity: e.target.value }))}
                      className="aura-input text-center" style={{ width: 70 }} />
                    <button onClick={() => addComponent(asset.id)}
                      className="font-black px-4 py-2 rounded-lg text-sm"
                      style={{ background: "#7C3AED", color: "#fff" }}>
                      + Agregar
                    </button>
                  </div>

                  {avComps.length === 0 && (
                    <p className="text-xs" style={{ color: "#475569" }}>
                      No hay productos disponibles para agregar al BOM.
                      Crea uno con el formulario de arriba seleccionando "Componente interno".
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
