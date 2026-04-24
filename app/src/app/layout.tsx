import type { Metadata } from "next";
import { Source_Sans_3, Eczar, Lilita_One } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

/**
 * CURIA — Sistema tipográfico
 * -----------------------------------------------------------------------------
 * Source Sans 3  → Tech/inovação. Headlines, UI, CTAs, números.
 * Eczar          → Pensamento sério. Corpo, chat, citações.
 * Lilita One     → Identidade de marca. Apenas o logotipo "Curia".
 * Agfolan        → Acento raro da marca. Carregada via @font-face (local).
 *
 * Carregamento via next/font: self-hosted, zero layout shift, melhor
 * performance que <link> do Google Fonts.
 * -----------------------------------------------------------------------------
 */

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-curia-ui",
  display: "swap",
});

const eczar = Eczar({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-curia-body",
  display: "swap",
});

const lilitaOne = Lilita_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-curia-logo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Curia — O conselho executivo de IA",
  description:
    "Um board de conselheiros de IA treinado sobre as decisões que construíram as empresas que mais cresceram no Brasil, dentro da sua empresa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      translate="no"
      className={`${sourceSans.variable} ${eczar.variable} ${lilitaOne.variable}`}
    >
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="antialiased font-curia-body">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
