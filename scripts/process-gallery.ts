import sharp from "sharp";
import { readdirSync, mkdirSync } from "fs";
import { join, extname, basename } from "path";

const INPUT  = join(process.cwd(), "public", "Galeria");
const OUTPUT = join(process.cwd(), "public", "galeria");
mkdirSync(OUTPUT, { recursive: true });

// Imágenes que NO necesitan difuminar (no hay rostros reconocibles: son costumes, equipos, escenas)
const NO_BLUR = [
  "cabezon+pirotecnia",
  "cabezones + robot led",
  "cabezones 03",
  "cabezones+carrito de shots",
  "cabezones02",
  "carrito de shot 02",
  "carrito de shots01",
  "robot1",
  "robot03",
  "sonido01 (2)",
  "sonido01",
  "sonido03",
];

function needsBlur(filename: string): boolean {
  const nameWithoutExt = basename(filename, extname(filename)).toLowerCase();
  return !NO_BLUR.some((nb) => nb.toLowerCase() === nameWithoutExt);
}

function cleanName(file: string): string {
  return basename(file, extname(file))
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    + ".webp";
}

async function main() {
  const files = readdirSync(INPUT).filter((f) =>
    [".jpg",".jpeg",".png"].includes(extname(f).toLowerCase())
  );
  console.log(`Procesando ${files.length} imágenes...\n`);

  for (const file of files) {
    const inputPath  = join(INPUT, file);
    const outputPath = join(OUTPUT, cleanName(file));
    const blur       = needsBlur(file);

    const img  = sharp(inputPath);
    const meta = await img.metadata();
    const w    = meta.width  ?? 1280;
    const maxW = Math.min(w, 1400);

    if (!blur) {
      // Solo redimensionar y convertir — sin blur
      await sharp(inputPath)
        .resize({ width: maxW, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);
      console.log(`  ✅ [sin blur] ${file.padEnd(35)} → ${cleanName(file)}`);
    } else {
      // Redimensionar + blur en zona de rostros
      const scale  = maxW / w;
      const newH   = Math.round((meta.height ?? 720) * scale);
      const faceH  = Math.round(newH * 0.55);
      const faceW  = Math.round(maxW * 0.80);
      const left   = Math.round((maxW - faceW) / 2);

      const base = await sharp(inputPath)
        .resize({ width: maxW, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const blurred = await sharp(base)
        .extract({ left, top: 0, width: faceW, height: faceH })
        .blur(14)
        .jpeg({ quality: 80 })
        .toBuffer();

      await sharp(base)
        .composite([{ input: blurred, top: 0, left, blend: "over" }])
        .webp({ quality: 82 })
        .toFile(outputPath);
      console.log(`  🔵 [con blur] ${file.padEnd(35)} → ${cleanName(file)}`);
    }
  }
  console.log("\n✅ Listo.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
