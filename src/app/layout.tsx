import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import AuthSessionProvider from "@/components/ui/SessionProvider";
import PWARegister     from "@/components/ui/PWARegister";
import WhatsAppButton  from "@/components/ui/WhatsAppButton";
import { getWhatsAppSettings } from "@/lib/cached-settings";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const dm = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm",
  display: "swap",
});

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://daysu.vip";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Daysu.vip — Eventos Legendarios en Zacatecas",
    template: "%s — Daysu.vip",
  },
  description: "Paquetes de DJ, audio, iluminación y shows para bodas, quinceañeras y eventos hasta 500 personas en Zacatecas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Daysu.vip",
    startupImage: "/apple-touch-icon.png",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png",  sizes: "32x32",   type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Daysu.vip — Eventos Legendarios en Zacatecas",
    description: "Paquetes VIP de DJ, audio, iluminación y shows para bodas, quinceañeras y eventos hasta 500 personas en Zacatecas.",
    type: "website",
    url: BASE_URL,
    siteName: "Daysu.vip",
    locale: "es_MX",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Daysu.vip — Eventos en Zacatecas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daysu.vip",
    description: "Paquetes VIP para eventos en Zacatecas",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale y userScalable quitados — WCAG 1.4.4 requiere que el usuario
  // pueda hacer zoom. El problema del zoom en inputs iOS se resuelve con font-size≥16px
  viewportFit: "cover",  // edge-to-edge en iPhone con notch
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#E8198A" },
    { media: "(prefers-color-scheme: light)", color: "#E8198A" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { number: waNumber, message: waMessage } = await getWhatsAppSettings();

  return (
    <html lang="es" className={`${bebas.variable} ${dm.variable}`}
      style={{ background: "#05051a" }}
      suppressHydrationWarning>
      <body style={{
        background: "#05051a",
        color: "#f5f0e8",
        fontFamily: "var(--font-dm, DM Sans, sans-serif)",
        overflowX: "hidden",
        WebkitTapHighlightColor: "transparent",  // quita flash azul al tocar en iOS
        WebkitTextSizeAdjust: "100%",             // evita resize de texto en landscape
      }}>
        <AuthSessionProvider>
          <PWARegister />
          <a href="#main-content" className="skip-link">Saltar al contenido</a>
          <Navbar />
          <main id="main-content">{children}</main>
          <WhatsAppButton number={waNumber} message={waMessage} />
          {/* Safe area bottom — espacio para la barra home del iPhone */}
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
