'use client'

import { ReactNode, useEffect } from 'react'

interface SuperAdminThemeProviderProps {
  children: ReactNode
}

const PLATFORM_THEME = {
  primary: '#E67E22',
  black: '#0D0D0D',
  grey: '#333333',
}

const PLATFORM_VARS: Record<string, string> = {
  '--theme-primary': PLATFORM_THEME.primary,
  '--theme-heading': '#F8F9FA',
  '--theme-text': '#F8F9FA',
  '--theme-subtext': '#A0AAB2',
  '--theme-hero-bg': PLATFORM_THEME.black,
  '--theme-hero-text': '#F8F9FA',
}

export function SuperAdminThemeProvider({ children }: SuperAdminThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', 'motion-grid')

    // Hard-lock platform tokens so no workshop branding can bleed through.
    for (const [key, value] of Object.entries(PLATFORM_VARS)) {
      root.style.setProperty(key, value)
    }

    return () => {
      root.removeAttribute('data-theme')
      for (const key of Object.keys(PLATFORM_VARS)) {
        root.style.removeProperty(key)
      }
    }
  }, [])

  return <>{children}</>
}
