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
    <div className="space-y-2 mb-4">
      <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#D4AF37" }}>✦ Recomendaciones especiales</p>
      {visible.map((s) => (
        <div key={s.ruleId} className="flex items-center gap-3 rounded-xl p-3 border"
          style={{ background: "rgba(212,175,55,.06)", borderColor: "rgba(212,175,55,.25)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{s.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {s.discountPercent > 0 && (
                <span className="text-xs line-through" style={{ color: "#475569" }}>${s.originalPrice.toFixed(2)}</span>
              )}
              <span className="text-sm font-black" style={{ color: "#D4AF37" }}>
                {s.discountPercent > 0 ? `$${s.discountedPrice.toFixed(2)}` : "Add-on disponible"}
              </span>
              {s.discountPercent > 0 && (
                <span className="text-xs font-black px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(212,175,55,.15)", color: "#D4AF37" }}>
                  -{s.discountPercent}%
                </span>
              )}
            </div>
          </div>
          <button onClick={() => onAdd(s.suggestedAssetId, s.suggestedName, s.discountedPrice)}
            className="aura-btn-gold text-xs px-3 py-1.5 flex-shrink-0">
            + Agregar
          </button>
        </div>
      ))}
    </div>
  );
}
