import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Votação - Câmara de Vereadores de Ubaporanga",
  description: "Sistema de votação eletrônica para a Câmara de Vereadores de Ubaporanga",
  keywords: ["votação", "Câmara de Vereadores", "Ubaporanga", "sistema eletrônico"],
  authors: [{ name: "Câmara de Vereadores de Ubaporanga" }],
  openGraph: {
    title: "Sistema de Votação - Câmara de Ubaporanga",
    description: "Sistema de votação eletrônica para a Câmara de Vereadores de Ubaporanga",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
