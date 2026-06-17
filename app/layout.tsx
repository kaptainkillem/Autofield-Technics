import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/common/ConditionalLayout";
import "./globals.css";
import { SITE_CONFIG, replaceVars } from '@/lib/site-config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: replaceVars(SITE_CONFIG.seo.defaultTitle, { name: SITE_CONFIG.name, tagline: SITE_CONFIG.tagline }),
  description: replaceVars(SITE_CONFIG.seo.defaultDescription, { name: SITE_CONFIG.name, tagline: SITE_CONFIG.tagline }),
  icons: { icon: SITE_CONFIG.images.favicon },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col m-0 p-0">
        <Toaster position="top-right" richColors closeButton />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}