'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'

const HIDE_ON_PREFIXES = ['/dashboard']

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isDashboardRoute = HIDE_ON_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (isDashboardRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}