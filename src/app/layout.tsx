import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DTF UV Perú · CRM WhatsApp",
  description: "Panel web realtime para WhatsApp y CRM interno de DTF UV Perú.",
  metadataBase: new URL("https://dtfuvperu.com"),
  openGraph: {
    title: "DTF UV Perú · CRM WhatsApp",
    description: "Panel web realtime para conversaciones de WhatsApp conectado a Supabase.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
