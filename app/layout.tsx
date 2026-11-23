import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/common/ConditionalLayout";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import { TenantThemeWrapper } from "@/components/providers/TenantThemeWrapper";
import { getMergedSiteConfig } from "@/lib/get-site-config";
import { getFontFamilyStack } from '@/lib/homepage-content';
import "./globals.css";
import "@/styles/super-admin-theme.css";

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getMergedSiteConfig()
  return {
    title: config.seo.defaultTitle,
    description: config.seo.defaultDescription,
    icons: { icon: config.images.favicon },
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getGoogleFontLink(fontFamily: string): string | null {
  switch (fontFamily) {
    case 'Inter':
      return 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
    case 'Oswald':
      return 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap'
    case 'Roboto':
      return 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap'
    case 'Geist':
    case 'Arial':
    default:
      return null
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getMergedSiteConfig()
  const googleFontLink = getGoogleFontLink(siteConfig.fontFamily)
  const fontStack = getFontFamilyStack(siteConfig.fontFamily || 'Inter')

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ '--brand-font-sans': fontStack } as React.CSSProperties}
    >
      <head>
        {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
      </head>
      <body className="min-h-full flex flex-col m-0 p-0">
        <Toaster position="top-right" richColors closeButton />
        <SiteConfigProvider config={siteConfig}>
          <TenantThemeWrapper config={siteConfig}>
            <ConditionalLayout>{children}</ConditionalLayout>
          </TenantThemeWrapper>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
