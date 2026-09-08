import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.galleryVideo.count();
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), stack: e instanceof Error ? e.stack : null }, { status: 500 });
  }
}
