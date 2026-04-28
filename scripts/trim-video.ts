// @ts-ignore — no hay tipos oficiales para fluent-ffmpeg en este entorno
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
// @ts-ignore
import ffprobeStatic from "ffprobe-static";
import { join } from "path";

ffmpeg.setFfmpegPath(ffmpegStatic as string);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const input  = join(process.cwd(), "public", "hero-bg.mp4");
const output = join(process.cwd(), "public", "hero-bg-trim.mp4");

// Primero obtenemos la duración del video
function getDuration(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(path, (err: Error | null, meta: { format: { duration?: number } }) => {
      if (err) reject(err);
      else resolve(meta.format.duration ?? 0);
    });
  });
}

async function main() {
  const duration = await getDuration(input);
  const trimmedDuration = Math.max(0, duration - 1); // quitar último segundo

  console.log(`Duración original: ${duration.toFixed(2)}s`);
  console.log(`Duración final:    ${trimmedDuration.toFixed(2)}s`);
  console.log("Procesando...");

  await new Promise<void>((resolve, reject) => {
    ffmpeg(input)
      .setDuration(trimmedDuration)
      .videoCodec("copy")   // copia sin re-encodear → rápido
      .audioCodec("copy")
      .output(output)
      .on("end", () => resolve())
      .on("error", (e: Error) => reject(e))
      .run();
  });

  console.log(`✅ Video recortado guardado en: public/hero-bg-trim.mp4`);

  // Reemplazar el original
  const { renameSync } = await import("fs");
  renameSync(input, input.replace(".mp4", "-original.mp4"));
  renameSync(output, input);
  console.log("✅ Reemplazado el video original.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
