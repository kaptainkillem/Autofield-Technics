'use client'

import { createContext, useContext, ReactNode } from 'react'
import { MergedSiteConfig } from '@/lib/get-site-config'

const SiteConfigContext = createContext<MergedSiteConfig | null>(null)

interface SiteConfigProviderProps {
  config: MergedSiteConfig
  children: ReactNode
}

export function SiteConfigProvider({ config, children }: SiteConfigProviderProps) {
  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig(): MergedSiteConfig {
  const context = useContext(SiteConfigContext)
  if (!context) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider')
  }
  return context
}
