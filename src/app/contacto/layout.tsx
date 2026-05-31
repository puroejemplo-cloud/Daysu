import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta a Daysu.vip — Aura Producciones. Escríbenos por WhatsApp o llena el formulario para cotizar tu evento en Zacatecas.",
  alternates: { canonical: "https://daysu.vip/contacto" },
  openGraph: {
    title: "Contacto — Daysu.vip",
    description: "Escríbenos para cotizar tu evento en Zacatecas.",
    images: [{ url: "https://daysu.vip/api/og?title=Contáctanos", width: 1200, height: 630 }],
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
