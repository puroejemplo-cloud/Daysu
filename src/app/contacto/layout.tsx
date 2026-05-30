import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta a Daysu.vip — Aura Producciones. Escríbenos por WhatsApp o llena el formulario para cotizar tu evento en Zacatecas.",
  alternates: { canonical: "https://daysu.vip/contacto" },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
