import { SuperAdminThemeProvider } from '@/components/providers/SuperAdminThemeProvider'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SuperAdminThemeProvider>
      {children}
    </SuperAdminThemeProvider>
  )
}
