import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${BASE_URL}/blog/${slug}`,
      publishedTime: post.date,
    },
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.description,
    "datePublished": post.date,
    "author": { "@type": "Organization", "name": "Daysu.vip — Aura Producciones" },
    "publisher": {
      "@type": "Organization",
      "name": "Daysu.vip",
      "url": BASE_URL,
    },
    "url": `${BASE_URL}/blog/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.25rem 5rem", color: "var(--cream)" }}>
        {/* Hero */}
        <header style={{ padding: "5rem 0 3rem", maxWidth: "52rem" }}>
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "#52525b", textDecoration: "none", marginBottom: "1.5rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}>
            ← Blog
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: 99, background: "rgba(232,25,138,0.12)", color: "var(--gold)", border: "1px solid rgba(232,25,138,0.25)", letterSpacing: "0.08em" }}>
              {post.category}
            </span>
            <span style={{ fontSize: "0.68rem", color: "#52525b" }}>
              {format(new Date(post.date), "d 'de' MMMM 'de' yyyy", { locale: es })} · {post.readTime} min lectura
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.8rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.03em", textWrap: "balance" } as React.CSSProperties}>
            {post.title}
          </h1>
          <p style={{ color: "#71717a", fontSize: "1rem", marginTop: "1rem", lineHeight: 1.7, maxWidth: "44ch" }}>
            {post.description}
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem" }} className="lg:grid-cols-[1fr_280px]">
          {/* Content */}
          <div>
            {/* Intro */}
            <p style={{ fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.75, marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {post.intro}
            </p>

            {/* Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {post.sections.map((section, i) => (
                <section key={i}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f4f4f5", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
                    {section.heading}
                  </h2>
                  <p style={{ color: "#94a3b8", lineHeight: 1.8, fontSize: "0.95rem" }}>{section.body}</p>
                </section>
              ))}
            </div>

            {/* CTA inline */}
            <div style={{ marginTop: "3rem", padding: "1.75rem", borderRadius: "1rem", background: "rgba(232,25,138,0.06)", border: "1px solid rgba(232,25,138,0.2)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ color: "#f4f4f5", fontWeight: 700, fontSize: "1.05rem" }}>¿Listo para hacer tu evento legendario?</p>
              <p style={{ color: "#71717a", fontSize: "0.88rem", lineHeight: 1.6 }}>
                Daysu.vip cubre todo lo que necesitas — DJ, sonido, iluminación y shows en Zacatecas.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href={post.cta.href} className="btn-gold" style={{ textDecoration: "none", fontSize: "0.82rem" }}>
                  {post.cta.text}
                </Link>
                <Link href="/reservar" className="btn-ghost" style={{ textDecoration: "none", fontSize: "0.82rem" }}>
                  Cotizar ahora →
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.875rem", padding: "1.25rem", position: "sticky", top: "5.5rem" }}>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#52525b", marginBottom: "1rem" }}>
                Más artículos
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {related.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`}
                    style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.625rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#e4e4e7", lineHeight: 1.4 }}>{p.title}</span>
                    <span style={{ fontSize: "0.65rem", color: "#52525b" }}>{p.readTime} min</span>
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Link href="/reservar" className="btn-gold"
                  style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: "0.75rem", padding: "0.65rem" }}>
                  Cotizar mi evento
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
