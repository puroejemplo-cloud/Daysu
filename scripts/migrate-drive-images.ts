import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

const OUT_DIR = path.join(process.cwd(), "public", "productos");

function extFromContentType(ct: string | null): string {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  return "jpg";
}

async function downloadOne(url: string, sku: string, idx: number): Promise<{ localPath: string; size: number; contentType: string | null } | null> {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  FALLA ${res.status} ${url}`);
    return null;
  }
  const contentType = res.headers.get("content-type");
  const buf = Buffer.from(await res.arrayBuffer());
  if (!contentType || !contentType.startsWith("image/") || buf.length < 500) {
    console.error(`  RESPUESTA NO ES IMAGEN VALIDA (${contentType}, ${buf.length} bytes) ${url}`);
    return null;
  }
  const ext = extFromContentType(contentType);
  const filename = `${sku.toLowerCase()}-${Date.now()}-${idx}.${ext}`;
  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  return { localPath: `/productos/${filename}`, size: buf.length, contentType };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const assets = await prisma.asset.findMany({
    where: { imageUrl: { contains: "googleusercontent" } },
    select: { id: true, name: true, sku: true, imageUrl: true, imageGallery: true },
  });

  for (const asset of assets) {
    console.log(`\n== ${asset.name} (${asset.sku}) ==`);
    const gallery = Array.isArray(asset.imageGallery) ? (asset.imageGallery as string[]) : [];
    const urlToLocal = new Map<string, string>();

    let idx = 0;
    for (const url of gallery) {
      idx++;
      if (urlToLocal.has(url)) continue;
      console.log(`  Descargando [${idx}] ${url}`);
      const result = await downloadOne(url, asset.sku, idx);
      if (result) {
        console.log(`  -> ${result.localPath} (${result.size} bytes, ${result.contentType})`);
        urlToLocal.set(url, result.localPath);
      }
    }

    if (urlToLocal.size === 0) {
      console.log("  Sin imagenes descargadas, se deja como estaba.");
      continue;
    }

    const newGallery = gallery.map((u) => urlToLocal.get(u) ?? u).filter((u) => !u.includes("googleusercontent"));
    const newImageUrl = asset.imageUrl && urlToLocal.has(asset.imageUrl) ? urlToLocal.get(asset.imageUrl)! : (newGallery[0] ?? asset.imageUrl);

    await prisma.asset.update({
      where: { id: asset.id },
      data: { imageUrl: newImageUrl, imageGallery: newGallery },
    });
    console.log(`  DB actualizada: imageUrl=${newImageUrl}, imageGallery=${JSON.stringify(newGallery)}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
