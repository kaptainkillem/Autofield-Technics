import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-grey-lightest">
      <DashboardTopBar />
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className="pt-14 lg:pt-0 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}