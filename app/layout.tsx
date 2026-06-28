import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/common/ConditionalLayout";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import { getMergedSiteConfig } from "@/lib/get-site-config";
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
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

export async function generateMetadata(): Promise<Metadata> {
  // Fetch merged config for SEO metadata
  const config = await getMergedSiteConfig()

  return {
    title: config.seo.defaultTitle,
    description: config.seo.defaultDescription,
    icons: { icon: SITE_CONFIG.images.favicon },
  }
}

async function getBrandingCss() {
  try {
    const supabase = createSupabaseAdminClient()
    const { data } = await supabase
      .from('business_settings')
      .select('primary_color, accent_color, favicon_url')
      .eq('id', 'config')
      .single()

    if (data) {
      return `
        :root {
          --primary-color: ${data.primary_color || '#3B82F6'};
          --accent-color: ${data.accent_color || '#10B981'};
        }
      `
    }
  } catch {
    // Fallback if table doesn't exist or network fails
  }
  return `
    :root {
      --primary-color: #3B82F6;
      --accent-color: #10B981;
    }
  `
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandingCss = await getBrandingCss()
  const siteConfig = await getMergedSiteConfig()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
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
