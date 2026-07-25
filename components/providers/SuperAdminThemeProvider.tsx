'use client'

import { ReactNode, useEffect } from 'react'

interface SuperAdminThemeProviderProps {
  children: ReactNode
}

export function SuperAdminThemeProvider({ children }: SuperAdminThemeProviderProps) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'motion-grid')
    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  return <>{children}</>
}
