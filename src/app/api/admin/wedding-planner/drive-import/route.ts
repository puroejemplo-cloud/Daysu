import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

function extractFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return err("No autorizado", 401);

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return err("GOOGLE_DRIVE_API_KEY no configurada", 500);

  const { folderUrl } = await req.json() as { folderUrl?: string };
  if (!folderUrl?.trim()) return err("URL de carpeta requerida");

  const folderId = extractFolderId(folderUrl.trim());
  if (!folderId) return err("No se pudo extraer el ID de la carpeta. Asegúrate de que sea un enlace de Google Drive.");

  // Obtiene todos los archivos de imagen en la carpeta (hasta 1000)
  const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
  const fields = encodeURIComponent("files(id,name,mimeType),nextPageToken");
  const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${apiKey}&fields=${fields}&pageSize=200&orderBy=name`;

  const res = await fetch(apiUrl);
  const text = await res.text();

  // Parsear respuesta — puede ser HTML de error si la API no está habilitada
  let data: { files?: { id: string; name: string }[]; error?: { message?: string; status?: string } };
  try {
    data = JSON.parse(text);
  } catch {
    if (res.status === 403 || res.status === 400)
      return err("Error de acceso. Ve a console.cloud.google.com → Biblioteca → busca 'Google Drive API' → Habilitar.", 500);
    return err(`Error ${res.status} al consultar Google Drive. Intenta habilitar la Google Drive API en tu proyecto.`, 500);
  }

  if (!res.ok) {
    const msg = data.error?.message ?? "Error al consultar Google Drive";
    if (data.error?.status === "NOT_FOUND" || res.status === 404)
      return err("Carpeta no encontrada. Verifica que el enlace sea correcto y que la carpeta sea pública.");
    if (data.error?.status === "PERMISSION_DENIED" || res.status === 403)
      return err("Sin acceso. Asegúrate de que la carpeta esté compartida como 'Cualquier persona con el enlace'.");
    return err(msg, 500);
  }
  const files = data.files ?? [];

  if (files.length === 0)
    return err("La carpeta no tiene imágenes o no es pública.");

  // Convierte cada file.id a URL directa de imagen
  const imageUrls = files.map((f) => `https://lh3.googleusercontent.com/d/${f.id}`);

  // Guarda en system_settings
  await prisma.systemSetting.upsert({
    where: { key: "wp_gallery_images" },
    update: { value: JSON.stringify(imageUrls) },
    create: { key: "wp_gallery_images", value: JSON.stringify(imageUrls) },
  });

  return ok({ count: imageUrls.length, images: imageUrls });
}
