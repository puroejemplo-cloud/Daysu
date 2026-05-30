"use client";
import { useEffect, useState, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { CheckCircle, Clock, Share2, MessageCircle, CalendarDays, MapPin, User, Package, ChevronRight } from "lucide-react";

interface BookingData {
  id: string; eventName: string; status: string;
  setupAt: string; teardownAt: string; venueAddress: string | null;
  totalAmount: string; depositAmount: string; expiresAt: string | null;
  client: { fullName: string; email: string; phone: string | null };
  items: { id: number; quantity: number; unitPrice: string; asset: { name: string } }[];
}

const STATUS: Record<string, { label: string; bg: string; color: string; border: string; emoji: string }> = {
  pending_payment: { label: "Pendiente de pago", bg: "rgba(245,158,11,.09)",  color: "#f59e0b", border: "rgba(245,158,11,.3)",  emoji: "⏳" },
  confirmed:       { label: "Confirmada",         bg: "rgba(34,197,94,.09)",   color: "#22c55e", border: "rgba(34,197,94,.3)",   emoji: "✅" },
  expired:         { label: "Vencida",            bg: "rgba(239,68,68,.09)",   color: "#ef4444", border: "rgba(239,68,68,.3)",   emoji: "❌" },
  cancelled:       { label: "Cancelada",          bg: "rgba(100,116,139,.09)", color: "#64748b", border: "rgba(100,116,139,.3)", emoji: "🚫" },
  in_progress:     { label: "En curso",           bg: "rgba(124,58,237,.09)",  color: "#9333ea", border: "rgba(124,58,237,.3)",  emoji: "🎉" },
  completed:       { label: "Completada",         bg: "rgba(100,116,139,.09)", color: "#64748b", border: "rgba(100,116,139,.3)", emoji: "✓"  },
};

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{size?:number}>, label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.875rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#71717a" }}>
        <Icon size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#52525b", marginBottom: "0.2rem" }}>{label}</p>
        <div style={{ color: "#e4e4e7", fontSize: "0.88rem", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

export default function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const [booking,  setBooking]  = useState<BookingData | null>(null);
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/bookings/${bookingId}`);
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Reserva no encontrada"); return; }
    setBooking(json.data);
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: booking?.eventName, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error) return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "6rem 1.25rem", textAlign: "center" }}>
      <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>😔</p>
      <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: "1.5rem" }}>{error}</p>
      <Link href="/" className="btn-ghost" style={{ textDecoration: "none" }}>← Volver al inicio</Link>
    </div>
  );

  if (!booking) return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "6rem 1.25rem", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid var(--gold)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>Cargando tu reserva…</p>
      </div>
    </div>
  );

  const st      = STATUS[booking.status] ?? STATUS.cancelled;
  const total   = Number(booking.totalAmount);
  const deposit = Number(booking.depositAmount);
  const balance = total - deposit;
  const depositPct = total > 0 ? Math.round((deposit / total) * 100) : 0;
  const isConf  = booking.status === "confirmed";
  const isPend  = booking.status === "pending_payment";
  const isExp   = booking.status === "expired";
  const expires = booking.expiresAt ? new Date(booking.expiresAt) : null;
  const expired = expires ? expires < new Date() : false;

  const waText  = `Hola, tengo una reserva confirmada para ${booking.eventName} el ${format(new Date(booking.setupAt), "d 'de' MMMM", { locale: es })}. Mi número de reserva es ${booking.id.slice(0, 8).toUpperCase()}.`;

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "2rem 1.25rem 5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── HERO CARD ── */}
      <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${st.border}`, boxShadow: `0 0 60px ${st.bg}, 0 8px 40px rgba(0,0,0,.5)` }}>

        {/* Header */}
        <div style={{
          padding: "2rem 1.75rem 1.5rem",
          background: isConf
            ? "linear-gradient(135deg, #001508 0%, #0d0d0d 70%)"
            : isPend
            ? "linear-gradient(135deg, #1a1000 0%, #0d0d0d 70%)"
            : "linear-gradient(135deg, #0d0d0d, #1a1a2e)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${st.bg} 0%, transparent 70%)`, pointerEvents: "none" }} />

          {/* Status + ID */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                Reserva #{booking.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.15 }}>{booking.eventName}</h1>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.emoji} {st.label}
            </span>
          </div>

          {/* Datos rápidos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "0.75rem 1rem" }}>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Fecha</p>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{format(new Date(booking.setupAt), "d MMM yyyy", { locale: es })}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "0.75rem 1rem" }}>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Horario</p>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                {format(new Date(booking.setupAt), "HH:mm")} – {format(new Date(booking.teardownAt), "HH:mm")}h
              </p>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div style={{ background: "#0a0a18", padding: "0.875rem 1.75rem", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, var(--gold), #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: "0.9rem" }}>
            {booking.client.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color: "#e4e4e7", fontWeight: 600, fontSize: "0.88rem" }}>{booking.client.fullName}</p>
            <p style={{ color: "#52525b", fontSize: "0.72rem" }}>
              {booking.client.email.includes("@aura.local") ? "" : booking.client.email}
              {booking.client.phone ? ` · ${booking.client.phone}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── CONFIRMADA — banner celebración ── */}
      {isConf && (
        <div style={{ borderRadius: 16, padding: "1.25rem 1.5rem", background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.2)", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <CheckCircle size={22} style={{ color: "#22c55e", flexShrink: 0, marginTop: 2 } as React.CSSProperties} />
          <div>
            <p style={{ color: "#22c55e", fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.35rem" }}>¡Tu evento está confirmado!</p>
            <p style={{ color: "#94a3b8", fontSize: "0.83rem", lineHeight: 1.6 }}>
              El equipo de <strong style={{ color: "#fff" }}>Daysu.vip</strong> se pondrá en contacto contigo para coordinar los detalles de logística. Te llegará un WhatsApp de confirmación.
            </p>
          </div>
        </div>
      )}

      {/* ── PENDIENTE — alerta de pago ── */}
      {isPend && (
        <div style={{ borderRadius: 16, padding: "1.25rem 1.5rem", background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.25)" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
            <Clock size={20} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 } as React.CSSProperties} />
            <div>
              <p style={{ color: "#f59e0b", fontWeight: 800, fontSize: "1rem", marginBottom: "0.2rem" }}>Esperando confirmación de pago</p>
              {expires && !expired && (
                <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                  Tu reserva vence {formatDistanceToNow(expires, { locale: es, addSuffix: true })} ({format(expires, "d MMM · HH:mm'h'", { locale: es })})
                </p>
              )}
              {expired && <p style={{ color: "#ef4444", fontSize: "0.8rem", fontWeight: 600 }}>El plazo de pago venció. Contáctanos para reactivar.</p>}
            </div>
          </div>
          <p style={{ color: "#71717a", fontSize: "0.8rem", lineHeight: 1.6 }}>
            Si ya realizaste tu pago, nuestro equipo lo revisará y confirmará tu reserva en breve. ¿Tienes dudas? Escríbenos por WhatsApp.
          </p>
        </div>
      )}

      {/* ── DETALLES ── */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0f" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#52525b" }}>Detalles del evento</p>
        </div>
        <div style={{ padding: "0 1.25rem" }}>
          <Row icon={CalendarDays} label="Fecha y hora"
            value={`${format(new Date(booking.setupAt), "EEEE d 'de' MMMM yyyy", { locale: es })} · ${format(new Date(booking.setupAt), "HH:mm")}–${format(new Date(booking.teardownAt), "HH:mm")}h`} />
          {booking.venueAddress && (
            <Row icon={MapPin} label="Venue" value={booking.venueAddress} />
          )}
          <Row icon={User} label="Titular" value={booking.client.fullName} />
        </div>
      </div>

      {/* ── SERVICIOS ── */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0f" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Package size={13} style={{ color: "#52525b" } as React.CSSProperties} />
          <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#52525b" }}>Servicios reservados</p>
        </div>
        <div style={{ padding: "0.25rem 1.25rem" }}>
          {booking.items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", gap: "1rem", borderBottom: i < booking.items.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
              <span style={{ color: "#e4e4e7", fontWeight: 500, fontSize: "0.88rem" }}>
                {item.asset.name}
                {item.quantity > 1 && <span style={{ color: "#52525b", marginLeft: "0.35rem", fontSize: "0.78rem" }}>×{item.quantity}</span>}
              </span>
              <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.88rem", flexShrink: 0 }}>
                ${(Number(item.unitPrice) * item.quantity).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
        {/* Totales */}
        <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
            <span style={{ color: "#52525b" }}>Total del evento</span>
            <span style={{ color: "#94a3b8" }}>${total.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
            <span style={{ color: "#52525b" }}>Anticipo pagado ({depositPct}%)</span>
            <span style={{ color: "#4ade80" }}>−${deposit.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <span style={{ color: "#e4e4e7", fontWeight: 600, fontSize: "0.88rem" }}>Saldo pendiente</span>
            <span style={{ color: "var(--gold)", fontWeight: 800, fontSize: "1rem" }}>${balance.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN</span>
          </div>
        </div>
      </div>

      {/* ── PRÓXIMOS PASOS (solo confirmada) ── */}
      {isConf && (
        <div style={{ borderRadius: 16, padding: "1.25rem 1.5rem", background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.18)" }}>
          <p style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.875rem" }}>¿Qué sigue?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              "Recibirás un mensaje de WhatsApp con los detalles de coordinación.",
              "El equipo llegará 2 horas antes del evento para montar el equipo.",
              "El saldo restante se liquida el día del evento.",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, fontSize: "0.6rem", fontWeight: 800, background: "rgba(124,58,237,.25)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i + 1}
                </span>
                <p style={{ color: "#94a3b8", fontSize: "0.82rem", lineHeight: 1.55, marginTop: "0.15rem" }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTAs ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <a href={`https://wa.me/524929496372?text=${encodeURIComponent(waText)}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
            padding: "0.875rem", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: "0.88rem",
            background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37,211,102,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(37,211,102,0.12)")}>
          <MessageCircle size={17} />
          Contactar por WhatsApp
        </a>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button onClick={share}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.7rem", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: copied ? "#4ade80" : "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
            <Share2 size={14} />
            {copied ? "¡Copiado!" : "Compartir"}
          </button>
          <Link href="/catalogo"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.7rem", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
            Ver más servicios <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Vencida — CTA reagendar ── */}
      {(isExp || booking.status === "cancelled") && (
        <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
          <Link href="/reservar" className="btn-gold" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            Hacer nueva reserva →
          </Link>
        </div>
      )}
    </div>
  );
}
