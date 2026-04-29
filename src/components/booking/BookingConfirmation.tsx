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

const STATUS: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending_payment: { label: "Pendiente de pago", bg: "rgba(212,175,55,.1)",  color: "#D4AF37", icon: "⏳" },
  confirmed:       { label: "Confirmada",         bg: "rgba(22,163,74,.1)",   color: "#22c55e", icon: "✅" },
  expired:         { label: "Vencida",            bg: "rgba(239,68,68,.1)",   color: "#EF4444", icon: "❌" },
  cancelled:       { label: "Cancelada",          bg: "rgba(100,116,139,.1)", color: "#64748B", icon: "🚫" },
  in_progress:     { label: "En curso",           bg: "rgba(124,58,237,.1)",  color: "#9333EA", icon: "🎉" },
  completed:       { label: "Completada",         bg: "rgba(100,116,139,.1)", color: "#64748B", icon: "✓" },
};

export default function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/bookings/${bookingId}`);
    const json = await res.json();
    if (!res.ok) { setError(json.error); return; }
    setBooking(json.data);
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const handlePay = async () => {
    setPaying(true);
    const res = await fetch(`/api/checkout/${bookingId}`, { method: "POST" });
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
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-lg" style={{ color: "#EF4444" }}>{error}</p>
    </div>
  );

  if (!booking) return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center" style={{ color: "#94A3B8" }}>
      Cargando tu reserva VIP...
    </div>
  );

  const st = STATUS[booking.status] ?? { label: booking.status, bg: "rgba(100,116,139,.1)", color: "#64748B", icon: "•" };
  const total = Number(booking.totalAmount);
  const deposit = Number(booking.depositAmount);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-5" style={{ background: "var(--bg)" }}>

      {/* Header */}
      <div className="rounded-2xl p-6" style={{
        background: "linear-gradient(135deg,#0d0d2b 0%,#13133a 100%)",
        border: "1px solid rgba(124,58,237,.35)",
        boxShadow: "0 0 32px rgba(124,58,237,.2)"
      }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#7C3AED" }}>
          Reserva #{booking.id.slice(0, 8).toUpperCase()}
        </p>
        <h1 className="text-2xl font-black text-white mb-4">{booking.eventName}</h1>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
          style={{ background: st.bg, color: st.color }}>
          {st.icon} {st.label}
        </span>
      </div>

      {/* Hold countdown */}
      {booking.status === "pending_payment" && booking.expiresAt && (
        <div className="rounded-2xl p-5 border-2" style={{ background: "rgba(212,175,55,.06)", borderColor: "rgba(212,175,55,.4)" }}>
          <p className="font-black text-lg mb-1" style={{ color: "#D4AF37" }}>⏳ Vence {timeLeft}</p>
          <p className="text-sm mb-5" style={{ color: "#94A3B8" }}>
            Tu paquete está apartado hasta{" "}
            <strong style={{ color: "#D4AF37" }}>
              {format(new Date(booking.expiresAt), "d MMM yyyy 'a las' HH:mm'h'", { locale: es })}
            </strong>.
            Realiza el pago antes de que venza.
          </p>
          <div className="rounded-xl p-4 space-y-3 border" style={{ background: "var(--bg-card)", borderColor: "rgba(124,58,237,.2)" }}>
            <p className="font-black text-white">💳 Pago del apartado (30%)</p>
            <p className="text-3xl font-black" style={{ color: "#D4AF37" }}>
              ${deposit.toFixed(2)} <span className="text-sm font-normal" style={{ color: "#94A3B8" }}>MXN</span>
            </p>
            {error && <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>}
            <button onClick={handlePay} disabled={paying}
              className="w-full font-black py-3.5 rounded-xl text-base transition-opacity disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "#fff" }}>
              {paying ? "Redirigiendo..." : "💳 Pagar apartado con Stripe"}
            </button>
            <p className="text-xs text-center" style={{ color: "#475569" }}>
              Pago seguro vía Stripe. Al pagar, tu reserva queda confirmada automáticamente.
            </p>
          </div>
        </div>
      )}

      {booking.status === "confirmed" && (
        <div className="rounded-2xl p-5 border" style={{ background: "rgba(22,163,74,.08)", borderColor: "rgba(22,163,74,.3)" }}>
          <p className="font-black text-lg mb-1" style={{ color: "#22c55e" }}>✅ ¡Reserva confirmada!</p>
          <p className="text-sm" style={{ color: "#94A3B8" }}>
            Tu paquete está apartado. El equipo de Daysu.vip se pondrá en contacto para los detalles de logística.
          </p>
        </div>
      )}

      {/* Detalles */}
      <div className="aura-card p-6 space-y-3 text-sm">
        <h2 className="font-black text-white mb-3">Detalles del evento</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["FECHA",   format(new Date(booking.setupAt), "d MMMM yyyy", { locale: es })],
            ["HORARIO", `${format(new Date(booking.setupAt), "HH:mm")}h – ${format(new Date(booking.teardownAt), "HH:mm")}h`],
            ["CLIENTE", booking.client.fullName],
            ["CONTACTO", booking.client.email],
            ...(booking.venueAddress ? [["LUGAR", booking.venueAddress]] : []),
          ].map(([label, val]) => (
            <div key={label} className={label === "LUGAR" ? "col-span-2" : ""}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#7C3AED" }}>{label}</p>
              <p className="text-white">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Artículos */}
      <div className="aura-card p-6">
        <h2 className="font-black text-white mb-4">Paquetes reservados</h2>
        <div className="space-y-2">
          {booking.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm py-2"
              style={{ borderBottom: "1px solid rgba(124,58,237,.1)" }}>
              <span className="text-white">{item.asset.name} <span style={{ color: "#94A3B8" }}>×{item.quantity}</span></span>
              <span className="font-bold" style={{ color: "#D4AF37" }}>
                ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 flex flex-col gap-2 text-sm" style={{ borderTop: "1px solid rgba(124,58,237,.15)" }}>
          <div className="flex justify-between" style={{ color: "#94A3B8" }}>
            <span>Total del evento</span><span>${total.toFixed(2)} MXN</span>
          </div>
          <div className="flex justify-between font-black text-base">
            <span className="text-white">Apartado (30%)</span>
            <span style={{ color: "#D4AF37" }}>${deposit.toFixed(2)} MXN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
