"use client";
import { useEffect, useState } from "react";

interface Suggestion {
  ruleId: number;
  suggestedAssetId: number;
  suggestedName: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  label: string;
}

interface Props {
  selectedAssetIds: number[];
  onAdd: (assetId: number, name: string, price: number) => void;
  addedIds: number[];
}

export default function UpsellBanner({ selectedAssetIds, onAdd, addedIds }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (selectedAssetIds.length === 0) { setSuggestions([]); return; }
    fetch(`/api/upsell?assets=${selectedAssetIds.join(",")}`)
      .then((r) => r.json())
      .then((j) => setSuggestions(j.data ?? []));
  }, [selectedAssetIds]);

  const visible = suggestions.filter((s) => !addedIds.includes(s.suggestedAssetId));
  if (visible.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#FF3DA8" }}>
        ✦ Recomendaciones especiales
      </p>
      {visible.map((s) => (
        <div key={s.ruleId}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.85rem 1rem", borderRadius: 12,
            background: "rgba(232,25,138,0.06)",
            border: "1px solid rgba(232,25,138,0.22)",
          }}>

          {/* Ícono */}
          <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>🎁</span>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Nombre del producto */}
            <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f4f4f5", marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.suggestedName}
            </p>
            {/* Label del banner (descripción opcional de la regla) */}
            {s.label && s.label !== `✦ Recomendado para tu evento: ${s.suggestedName}` && (
              <p style={{ fontSize: "0.72rem", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.label}
              </p>
            )}
            {/* Precio */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
              {s.discountPercent > 0 && s.originalPrice > 0 && (
                <span style={{ fontSize: "0.72rem", color: "#52525b", textDecoration: "line-through" }}>
                  ${s.originalPrice.toLocaleString("es-MX")}
                </span>
              )}
              {s.discountedPrice > 0 ? (
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#FF3DA8" }}>
                  ${s.discountedPrice.toLocaleString("es-MX")} MXN
                </span>
              ) : (
                <span style={{ fontSize: "0.78rem", color: "#71717a" }}>Precio por confirmar</span>
              )}
              {s.discountPercent > 0 && (
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: 4, background: "rgba(232,25,138,0.12)", color: "#FF3DA8" }}>
                  -{s.discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Botón */}
          <button
            onClick={() => onAdd(s.suggestedAssetId, s.suggestedName, s.discountedPrice)}
            style={{
              flexShrink: 0, padding: "0.45rem 0.9rem", borderRadius: 8,
              fontSize: "0.75rem", fontWeight: 700,
              background: "var(--gold)", color: "#05051a",
              border: "none", cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            + Agregar
          </button>
        </div>
      ))}
    </div>
  );
}
