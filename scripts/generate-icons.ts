import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// SVG del ícono de la app — la "A" de Aura sobre fondo dorado
const iconSvg = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1a0428"/>
      <stop offset="100%" stop-color="#05051a"/>
    </radialGradient>
    <linearGradient id="aGrd" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#e9d5ff"/>
      <stop offset="30%" stop-color="#c084fc"/>
      <stop offset="65%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#6b21a8"/>
    </linearGradient>
    <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0"/>
      <stop offset="30%" stop-color="#f59e0b"/>
      <stop offset="70%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Fondo -->
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
  <!-- A shape -->
  <g transform="translate(${size * 0.5},${size * 0.5})">
    <!-- Escala relativa al tamaño -->
    <polygon points="${-size*0.28},${size*0.25} ${-size*0.08},${size*0.25}" fill="url(#aGrd)"/>
    <!-- Left leg -->
    <polygon points="0,${-size*0.28} ${-size*0.28},${size*0.25} ${-size*0.17},${size*0.25}" fill="url(#aGrd)"/>
    <!-- Right leg -->
    <polygon points="0,${-size*0.28} ${size*0.28},${size*0.25} ${size*0.17},${size*0.25}" fill="url(#aGrd)"/>
    <!-- Crossbar -->
    <rect x="${-size*0.16}" y="${-size*0.04}" width="${size*0.32}" height="${size*0.09}" rx="${size*0.02}" fill="url(#aGrd)"/>
  </g>
  <!-- Gold line bottom -->
  <rect x="0" y="${size*0.88}" width="${size}" height="${size*0.02}" fill="url(#goldLine)" rx="${size*0.01}"/>
  <!-- "AURA" text at bottom -->
  <text x="${size/2}" y="${size*0.96}" text-anchor="middle"
    font-family="Arial Black, sans-serif" font-size="${size*0.1}" font-weight="900"
    fill="#c9a84c" letter-spacing="${size*0.02}">AURA</text>
</svg>`;

async function main() {
  const publicDir = join(process.cwd(), "public");
  const iconsDir  = join(publicDir, "icons");
  mkdirSync(iconsDir, { recursive: true });

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  console.log("Generando íconos PNG...\n");
  for (const size of sizes) {
    const svg = Buffer.from(iconSvg(size));
    const out = join(iconsDir, `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`  ✅ icon-${size}.png`);
  }

  // Apple touch icon 180x180
  const appleOut = join(publicDir, "apple-touch-icon.png");
  await sharp(Buffer.from(iconSvg(180))).resize(180, 180).png().toFile(appleOut);
  console.log(`  ✅ apple-touch-icon.png`);

  // Favicon 32x32
  const faviconOut = join(publicDir, "favicon.ico.png");
  await sharp(Buffer.from(iconSvg(32))).resize(32, 32).png().toFile(faviconOut);
  console.log(`  ✅ favicon (32px)`);

  // SVG para la web también
  writeFileSync(join(iconsDir, "icon.svg"), iconSvg(512));
  console.log(`  ✅ icon.svg`);

  console.log("\n✅ Todos los íconos generados.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
