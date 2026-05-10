import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { list } from "@vercel/blob";

// Proxy de imágenes del blob — las sirve desde el mismo dominio de la app
// para evitar problemas de CORS / content-type / cache en el panel admin
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const p = req.nextUrl.searchParams.get("p");
  if (!p || !p.startsWith("galeria/")) return new Response("Invalid path", { status: 400 });

  try {
    const { blobs } = await list({ prefix: p });
    const blob = blobs.find((b) => b.pathname === p);
    if (!blob) return new Response("Not found", { status: 404 });

    const upstream = await fetch(blob.url, { cache: "no-store" });
    if (!upstream.ok) return new Response("Blob fetch failed", { status: 502 });

    const ext = p.split(".").pop()?.toLowerCase() ?? "";
    const MIME: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg",
      png: "image/png",  webp: "image/webp",
    };
    const contentType = MIME[ext] ?? blob.contentType ?? "image/jpeg";

    return new Response(await upstream.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
