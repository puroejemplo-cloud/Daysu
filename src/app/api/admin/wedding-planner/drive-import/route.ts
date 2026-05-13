import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { auth } from "@/auth";

function extractFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return err("No autorizado", 401);

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) return err("GOOGLE_DRIVE_API_KEY no configurada en el servidor", 500);

    const body = await req.json() as { folderUrl?: string };
    const folderUrl = body.folderUrl?.trim();
    if (!folderUrl) return err("URL de carpeta requerida");

    const folderId = extractFolderId(folderUrl);
    if (!folderId) return err("No se pudo extraer el ID de la carpeta. Usa el enlace completo de Google Drive.");

    const query  = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
    const fields = encodeURIComponent("files(id,name),nextPageToken");
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${apiKey}&fields=${fields}&pageSize=200&orderBy=name`;

    let driveRes: Response;
    try {
      driveRes = await fetch(apiUrl);
    } catch (networkErr) {
      return err(`Error de red al contactar Google Drive: ${networkErr instanceof Error ? networkErr.message : "desconocido"}`, 500);
    }

    const text = await driveRes.text();
    if (!text) return err(`Google Drive respondió vacío (status ${driveRes.status})`, 500);

    let data: { files?: { id: string }[]; error?: { message?: string; status?: string } };
    try {
      data = JSON.parse(text);
    } catch {
      return err(`Respuesta inválida de Google Drive (status ${driveRes.status}). Verifica que la Google Drive API esté habilitada.`, 500);
    }

    if (!driveRes.ok) {
      const msg = data.error?.message ?? `Error ${driveRes.status} de Google Drive`;
      if (driveRes.status === 404 || data.error?.status === "NOT_FOUND")
        return err("Carpeta no encontrada. Verifica que el enlace sea correcto y la carpeta sea pública.");
      if (driveRes.status === 403 || data.error?.status === "PERMISSION_DENIED")
        return err("Sin acceso. Asegúrate de que la carpeta esté compartida como 'Cualquier persona con el enlace'.");
      return err(msg, 500);
    }

    const files = data.files ?? [];
    if (files.length === 0)
      return err("La carpeta no tiene imágenes, o no está compartida públicamente.");

    const imageUrls = files.map((f) => `https://lh3.googleusercontent.com/d/${f.id}`);

    await prisma.systemSetting.upsert({
      where:  { key: "wp_gallery_images" },
      update: { value: JSON.stringify(imageUrls) },
      create: { key: "wp_gallery_images", value: JSON.stringify(imageUrls) },
    });

    return ok({ count: imageUrls.length, images: imageUrls });

  } catch (e) {
    return err(e instanceof Error ? e.message : "Error inesperado al importar", 500);
  }
}
