import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Lilita_One } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

/**
 * CURIA — Sistema tipográfico v3 (editorial-tech) — CORRIGIDO
 *
 * Fix crítico: weight em array (não string "variable").
 * Fix crítico: variáveis CSS sem referência circular.
 * -----------------------------------------------------------------------------
 */

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-curia-editorial",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-curia-tech",
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
    "Um board de conselheiros de IA com a inteligência estratégica de uma big tech — pela primeira vez, dentro da sua empresa.",
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
      className={`${fraunces.variable} ${sourceSans.variable} ${lilitaOne.variable}`}
    >
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
