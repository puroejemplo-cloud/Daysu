"use client";
import { useEffect, useState, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface BookingData {
  id: string; eventName: string; status: string;
  setupAt: string; teardownAt: string; venueAddress: string | null;
  totalAmount: string; depositAmount: string; expiresAt: string | null;
  client: { fullName: string; email: string; phone: string | null };
  items: { id: number; quantity: number; unitPrice: string; asset: { name: string } }[];
}

const STATUS: Record<string, { label: string; bg: string; color: string; border: string; icon: string }> = {
  pending_payment: { label: "Pendiente de pago", bg: "rgba(232,25,138,.08)",  color: "#FF3DA8", border: "rgba(232,25,138,.3)",  icon: "⏳" },
  confirmed:       { label: "Confirmada",         bg: "rgba(22,163,74,.08)",   color: "#22c55e", border: "rgba(22,163,74,.3)",   icon: "✅" },
  expired:         { label: "Vencida",            bg: "rgba(239,68,68,.08)",   color: "#EF4444", border: "rgba(239,68,68,.3)",   icon: "❌" },
  cancelled:       { label: "Cancelada",          bg: "rgba(100,116,139,.08)", color: "#64748B", border: "rgba(100,116,139,.3)", icon: "🚫" },
  in_progress:     { label: "En curso",           bg: "rgba(124,58,237,.08)",  color: "#9333EA", border: "rgba(124,58,237,.3)",  icon: "🎉" },
  completed:       { label: "Completada",         bg: "rgba(100,116,139,.08)", color: "#64748B", border: "rgba(100,116,139,.3)", icon: "✓" },
};

export default function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const [booking, setBooking]   = useState<BookingData | null>(null);
  const [error, setError]       = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [paying, setPaying]     = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/bookings/${bookingId}`);
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    setBooking(json.data);
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const handlePay = async () => {
    setPaying(true);
    const res  = await fetch(`/api/checkout/${bookingId}`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setPaying(false); return; }
    window.location.href = json.data.url;
  };

  useEffect(() => {
    if (!booking?.expiresAt) return;
    const tick = () => {
      const exp = new Date(booking.expiresAt!);
      if (exp < new Date()) { setTimeLeft("Vencido"); return; }
      setTimeLeft(formatDistanceToNow(exp, { locale: es, addSuffix: true }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking?.expiresAt]);

  if (error) return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "6rem 1.25rem", textAlign: "center" }}>
      <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>😔</p>
      <p style={{ color: "#EF4444", fontWeight: 700 }}>{error}</p>
    </div>
  );

  if (!booking) return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "6rem 1.25rem", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid var(--gold)", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>Cargando tu reserva VIP...</p>
      </div>
    </div>
  );

  const st      = STATUS[booking.status] ?? { label: booking.status, bg: "rgba(100,116,139,.08)", color: "#64748B", border: "rgba(100,116,139,.3)", icon: "•" };
  const total   = Number(booking.totalAmount);
  const deposit = Number(booking.depositAmount);
  const isConf  = booking.status === "confirmed";
  const isPend  = booking.status === "pending_payment";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1.25rem 4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div style={{
        borderRadius: 20, overflow: "hidden",
        border: `1px solid ${st.border}`,
        boxShadow: `0 0 40px ${st.bg}, 0 2px 40px rgba(0,0,0,.4)`,
      }}>
        <div style={{
          background: isConf
            ? "linear-gradient(135deg, #001a0d 0%, #0d0d0d 60%, #001a05 100%)"
            : isPend
            ? "linear-gradient(135deg, #130033 0%, #0d0d2b 55%, #1a000d 100%)"
            : "linear-gradient(135deg, #0d0d0d, #1a1a2e)",
          padding: "1.75rem", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%",
            background: `radial-gradient(circle, ${st.bg} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* ID + badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.2rem" }}>
                Reserva #{booking.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", lineHeight: 1.2 }}>{booking.eventName}</h1>
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
            }}>
              {st.icon} {st.label}
            </span>
          </div>

          {/* Fecha + hora */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Fecha</p>
              <p style={{ color: "#fff", fontWeight: 800 }}>{format(new Date(booking.setupAt), "d MMMM yyyy", { locale: es })}</p>
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Horario</p>
              <p style={{ color: "#fff", fontWeight: 800 }}>
                {format(new Date(booking.setupAt), "HH:mm")}h – {format(new Date(booking.teardownAt), "HH:mm")}h
              </p>
            </div>
            {booking.venueAddress && (
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Venue</p>
                <p style={{ color: "#fff", fontWeight: 700 }}>{booking.venueAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div style={{ background: "#0a0a18", padding: "1rem 1.75rem", borderTop: "1px solid rgba(255,255,255,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--gold), #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, color: "#fff", fontSize: "0.95rem",
            }}>
              {booking.client.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{booking.client.fullName}</p>
              <p style={{ color: "#52525b", fontSize: "0.78rem" }}>
                {booking.client.email}{booking.client.phone ? ` · ${booking.client.phone}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAGO PENDIENTE ─────────────────────────────── */}
      {isPend && booking.expiresAt && (
        <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(232,25,138,.25)" }}>
          <div style={{ padding: "1.25rem 1.5rem", background: "rgba(232,25,138,.06)", borderBottom: "1px solid rgba(232,25,138,.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "1.3rem" }}>⏳</span>
              <p style={{ color: "#FF3DA8", fontWeight: 900, fontSize: "1.05rem" }}>Vence {timeLeft}</p>
            </div>
            <p style={{ color: "#94A3B8", fontSize: "0.82rem", lineHeight: 1.5 }}>
              Tu paquete está apartado hasta{" "}
              <strong style={{ color: "#FF3DA8" }}>
                {format(new Date(booking.expiresAt), "d MMM yyyy 'a las' HH:mm'h'", { locale: es })}
              </strong>.
              Realiza el pago antes de que expire.
            </p>
          </div>
          <div style={{ padding: "1.5rem", background: "#07070f" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem" }}>
              <div>
                <p style={{ color: "var(--gold)", fontWeight: 800, fontSize: "0.95rem" }}>Depósito (30%)</p>
                <p style={{ color: "#52525b", fontSize: "0.72rem", marginTop: "0.1rem" }}>Pago seguro vía Stripe</p>
              </div>
              <p style={{ color: "var(--gold)", fontWeight: 900, fontSize: "1.8rem", flexShrink: 0 }}>
                ${deposit.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#52525b", marginLeft: "0.25rem" }}>MXN</span>
              </p>
            </div>
            {error && <p style={{ color: "#EF4444", fontSize: "0.82rem", marginBottom: "0.75rem" }}>{error}</p>}
            <button onClick={handlePay} disabled={paying}
              style={{
                width: "100%", padding: "1rem", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #7C3AED, #9333EA)", color: "#fff",
                fontWeight: 900, fontSize: "1rem", letterSpacing: "0.03em",
                opacity: paying ? 0.6 : 1, transition: "opacity 0.2s",
              }}>
              {paying ? "Redirigiendo a Stripe..." : "💳 Pagar apartado ahora"}
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMADA ─────────────────────────────────── */}
      {isConf && (
        <div style={{ borderRadius: 20, padding: "1.5rem", background: "rgba(22,163,74,.07)", border: "1px solid rgba(22,163,74,.25)", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "2rem", flexShrink: 0 }}>🎉</span>
          <div>
            <p style={{ color: "#22c55e", fontWeight: 900, fontSize: "1.1rem", marginBottom: "0.35rem" }}>¡Reserva confirmada!</p>
            <p style={{ color: "#94A3B8", fontSize: "0.84rem", lineHeight: 1.55 }}>
              Tu paquete está apartado. El equipo de <strong style={{ color: "#fff" }}>Daysu.vip</strong> se pondrá en contacto contigo para coordinar los detalles de logística.
            </p>
          </div>
        </div>
      )}

      {/* ── SERVICIOS ──────────────────────────────────── */}
      <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ padding: "1rem 1.5rem", background: "#0a0a18", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
          <p style={{ color: "rgba(255,255,255,.35)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Servicios reservados</p>
        </div>
        <div style={{ background: "#07070f", padding: "0.75rem 1.5rem" }}>
          {booking.items.map((item, i) => (
            <div key={item.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.75rem 0", gap: "1rem",
              borderBottom: i < booking.items.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none",
            }}>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>
                {item.asset.name}
                {item.quantity > 1 && <span style={{ color: "#52525b", marginLeft: "0.4rem" }}>×{item.quantity}</span>}
              </span>
              <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.88rem", flexShrink: 0 }}>
                ${(Number(item.unitPrice) * item.quantity).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
        <div style={{ padding: "1rem 1.5rem", background: "#0a0a18", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
            <span style={{ color: "#52525b" }}>Total del evento</span>
            <span style={{ color: "#94A3B8", fontWeight: 600 }}>${total.toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.84rem", fontWeight: 600 }}>Apartado pagado (30%)</span>
            <span style={{ color: "var(--gold)", fontWeight: 900, fontSize: "1.05rem" }}>${deposit.toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN</span>
          </div>
        </div>
      </div>

      {/* ── PRÓXIMOS PASOS ─────────────────────────────── */}
      {(isPend || isConf) && (
        <div style={{ borderRadius: 20, padding: "1.25rem 1.5rem", background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.18)" }}>
          <p style={{ color: "#9333ea", fontWeight: 800, fontSize: "0.84rem", marginBottom: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>¿Qué sigue?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {[
              isPend ? "Completa el pago del depósito (30%) para confirmar tu fecha." : "✓ Depósito pagado — fecha confirmada.",
              "Recibirás un mensaje de WhatsApp con los detalles de tu evento.",
              "El equipo llegará 1 hora antes para montar el equipo.",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0, fontSize: "0.65rem", fontWeight: 900,
                  background: i === 0 && isPend ? "var(--gold)" : "rgba(124,58,237,.3)",
                  color: i === 0 && isPend ? "#000" : "#9333ea",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i + 1}
                </span>
                <p style={{ color: i === 0 && isPend ? "var(--cream)" : "#94A3B8", fontSize: "0.83rem", lineHeight: 1.5, marginTop: "0.15rem" }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
