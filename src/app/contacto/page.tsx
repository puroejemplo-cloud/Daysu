import { prisma } from "@/lib/prisma";
import ContactoClient from "./ContactoClient";

export { default as metadata } from "./layout";

export default async function ContactoPage() {
  let waNumber = "524929496372";
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key: "whatsapp_number" } });
    if (s?.value) waNumber = s.value;
  } catch {}

  return <ContactoClient waNumber={waNumber} />;
}
