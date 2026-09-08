import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET() {
  revalidatePath("/galeria");
  return NextResponse.json({ ok: true });
}
