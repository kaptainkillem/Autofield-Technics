'use client'

import type { CSSProperties, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { MergedSiteConfig } from '@/lib/get-site-config'

interface TenantThemeWrapperProps {
  config: MergedSiteConfig
  children: ReactNode
}

const PLATFORM_DEFAULTS = {
  primary: '#3B82F6',
  heading: '#111827',
  text: '#111827',
  subtext: '#595959',
  heroBg: '#E8E8E8',
  heroText: '#111827',
}

export function TenantThemeWrapper({ config, children }: TenantThemeWrapperProps) {
  const pathname = usePathname()

  // Super-admin pages are permanently locked to the platform dark theme.
  // Never inject workshop branding variables there.
  if (pathname?.startsWith('/dashboard/super-admin')) {
    return <>{children}</>
  }

  const style = {
    '--theme-primary': config.primaryColor || PLATFORM_DEFAULTS.primary,
    '--theme-heading': config.headingColor || PLATFORM_DEFAULTS.heading,
    '--theme-text': config.textColor || PLATFORM_DEFAULTS.text,
    '--theme-subtext': config.subtextColor || PLATFORM_DEFAULTS.subtext,
    '--theme-hero-bg': config.heroBgColor || PLATFORM_DEFAULTS.heroBg,
    '--theme-hero-text': config.heroTextColor || PLATFORM_DEFAULTS.heroText,

    // Backward-compat aliases for components/utilities that still read --brand-*.
    '--brand-primary': config.primaryColor || PLATFORM_DEFAULTS.primary,
    '--brand-text-primary': config.textColor || PLATFORM_DEFAULTS.text,
    '--brand-text-secondary': config.subtextColor || PLATFORM_DEFAULTS.subtext,
  } as CSSProperties

  return (
    <div className="contents" style={style}>
      {children}
    </div>
  )
}
