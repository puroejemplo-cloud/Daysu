import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Blog — Consejos para Eventos en Zacatecas",
  description: "Guías, consejos y tendencias para bodas, quinceañeras y eventos en Zacatecas. Todo lo que necesitas saber para que tu evento sea legendario.",
  openGraph: {
    title: "Blog — Daysu.vip",
    description: "Guías para eventos en Zacatecas.",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Bodas":        "#f472b6",
  "XV Años":      "#a78bfa",
  "Shows":        "#38bdf8",
  "Entretenimiento": "#4ade80",
  "Consejos":     "#fb923c",
};

export default function BlogPage() {
  const sorted = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ minHeight: "100vh", color: "var(--cream)" }}>
      {/* Header */}
      <div style={{ padding: "5rem 1.25rem 3.5rem", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
        <p className="section-label" style={{ position: "relative" }}>Recursos gratuitos</p>
        <h1 className="bebas section-title" style={{ position: "relative", marginTop: "0.5rem" }}>Blog y Guías</h1>
        <p style={{ position: "relative", color: "#64748b", fontSize: "0.9rem", marginTop: "0.75rem", maxWidth: 420, margin: "0.75rem auto 0" }}>
          Consejos reales de quienes organizan cientos de eventos en Zacatecas cada año.
        </p>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem 5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {sorted.map((post) => {
          const accent = CATEGORY_COLORS[post.category] ?? "var(--gold)";
          return (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <article style={{
                background: "#0c0c0f",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "1rem",
                padding: "1.5rem",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                transition: "border-color 0.2s, transform 0.2s",
                cursor: "pointer",
              }}
              className="blog-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 99, background: `${accent}18`, color: accent, border: `1px solid ${accent}30`, letterSpacing: "0.06em" }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "#3f3f46", marginLeft: "auto" }}>
                    {post.readTime} min lectura
                  </span>
                </div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f4f4f5", lineHeight: 1.4, textWrap: "balance" } as React.CSSProperties}>
                  {post.title}
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#71717a", lineHeight: 1.6, flex: 1 }}>
                  {post.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "0.68rem", color: "#3f3f46" }}>
                    {format(new Date(post.date), "d MMM yyyy", { locale: es })}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: accent, fontWeight: 600 }}>Leer →</span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
