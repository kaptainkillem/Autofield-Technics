'use client'

import { SessionTimeoutProvider } from '@/components/providers/SessionTimeoutProvider'

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return <SessionTimeoutProvider>{children}</SessionTimeoutProvider>
}
