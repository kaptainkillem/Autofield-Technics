import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/common/ConditionalLayout";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import { getMergedSiteConfig } from "@/lib/get-site-config";
import { deriveThemeColors } from '@/lib/color-utils';
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

function buildBrandingCss(primaryColor: string, accentColor: string, fontFamily: string, primaryTextColor: string, secondaryTextColor: string) {
  const colors = deriveThemeColors(primaryColor, accentColor)
  const fontStack = getFontFamilyStack(fontFamily || 'Inter')
  return `
    :root {
      --brand-primary: ${colors.primary};
      --brand-primary-dark: ${colors.primaryDark};
      --brand-primary-light: ${colors.primaryLight};
      --brand-accent: ${colors.accent};
      --brand-accent-dark: ${colors.accentDark};
      --brand-accent-light: ${colors.accentLight};
      --brand-text-primary: ${primaryTextColor};
      --brand-text-secondary: ${secondaryTextColor};
      --brand-font-sans: ${fontStack};
    }
  `
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getMergedSiteConfig()
  const brandingCss = buildBrandingCss(siteConfig.primaryColor, siteConfig.accentColor, siteConfig.fontFamily, siteConfig.primaryTextColor, siteConfig.secondaryTextColor)
  const googleFontLink = getGoogleFontLink(siteConfig.fontFamily)

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {googleFontLink && <link rel="stylesheet" href={googleFontLink} />}
        <style dangerouslySetInnerHTML={{ __html: brandingCss }} />
      </head>
      <body className="min-h-full flex flex-col m-0 p-0">
        <Toaster position="top-right" richColors closeButton />
        <SiteConfigProvider config={siteConfig}>
          <ConditionalLayout>{children}</ConditionalLayout>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
