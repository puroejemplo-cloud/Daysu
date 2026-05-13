import { MessageCircle, Sparkles, PartyPopper } from "lucide-react";

interface Step { title: string; desc: string }
interface WeddingStepsProps { steps: Step[] }

const GOLD = "#D4AF37";
const ICONS = [MessageCircle, Sparkles, PartyPopper];

export function WeddingSteps({ steps }: WeddingStepsProps) {
  const items = steps.length ? steps : [
    { title: "Nos contactas",     desc: "Cuéntanos tu idea y fecha tentativa." },
    { title: "Planificamos todo", desc: "Coordinamos proveedores, logística y detalles." },
    { title: "Tú solo disfrutas", desc: "El día del evento, nosotros nos encargamos." },
  ];

  return (
    <section style={{ background: "#07071c", padding: "5rem 1.25rem", position: "relative", overflow: "hidden" }}>

      {/* Fondo decorativo */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.2em", color: GOLD, textTransform: "uppercase", marginBottom: 10 }}>
            ✦ El proceso ✦
          </p>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 700, color: "#f5f0e8", margin: 0 }}>
            ¿Cómo funciona?
          </h2>
        </div>

        {/* Steps */}
        <div style={{ position: "relative" }}>

          {/* Línea conectora desktop */}
          <div className="ws-connector" style={{
            position: "absolute", top: 44,
            left: "calc(16.66% + 24px)", right: "calc(16.66% + 24px)",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.25) 20%, rgba(212,175,55,0.25) 80%, transparent)",
            zIndex: 0,
          }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", position: "relative", zIndex: 1 }}>
            {items.map((step, i) => {
              const Icon = ICONS[i] ?? Sparkles;
              return (
                <div key={i} className="ws-card" style={{
                  textAlign: "center",
                  padding: "1.75rem 1.25rem",
                  borderRadius: "1rem",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
                  cursor: "default",
                }}>

                  {/* Ícono con badge numérico */}
                  <div style={{ position: "relative", display: "inline-block", marginBottom: "1.25rem" }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "rgba(212,175,55,0.08)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto",
                    }}>
                      <Icon size={26} style={{ color: GOLD }} strokeWidth={1.5} />
                    </div>
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      width: 22, height: 22, borderRadius: "50%",
                      background: GOLD, color: "#05051a",
                      fontSize: "0.65rem", fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 0 3px #07071c",
                    }}>
                      {i + 1}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f5f0e8", marginBottom: 8 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.83rem", color: "rgba(245,240,232,0.5)", lineHeight: 1.65, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .ws-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(212,175,55,0.1);
          border-color: rgba(212,175,55,0.2) !important;
        }
        @media (max-width: 640px) {
          .ws-connector { display: none !important; }
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
