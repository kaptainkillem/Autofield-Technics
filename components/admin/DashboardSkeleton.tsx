import { Skeleton } from '@/components/ui/Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-[1600px] mx-auto w-full mt-4">
      {/* Header Block Skeleton */}
      <div className="flex flex-col gap-2 border-b border-grey-medium/10 pb-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats Grid Skeleton - 5 stat cards matching AdminStats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-grey-medium/10 rounded-base shadow-sm p-6 flex flex-col gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2-Col Block: Quotes + Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6 bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
          {/* Quotes Inbox Header */}
          <div className="flex items-center justify-between border-b border-grey-light pb-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Table Skeleton - 5 rows matching QuotesInbox table */}
          <div className="border border-grey-medium/10 rounded-base overflow-hidden">
            <div className="p-4 border-b border-grey-medium/20 bg-white flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-grey-medium/20">
                    <th className="py-3 px-4"><Skeleton className="h-3 w-16" /></th>
                    <th className="py-3 px-4 hidden md:table-cell"><Skeleton className="h-3 w-16" /></th>
                    <th className="py-3 px-4 hidden lg:table-cell"><Skeleton className="h-3 w-16" /></th>
                    <th className="py-3 px-4"><Skeleton className="h-3 w-12" /></th>
                    <th className="py-3 px-4 text-right"><Skeleton className="h-3 w-12 ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grey-light">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-28 mb-1" />
                        <Skeleton className="h-3 w-36" />
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Skeleton className="h-7 w-20 rounded-base ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Chart Skeleton */}
          <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        </div>

        {/* Right 1-Col Block: Quick Links + Jobs */}
        <div className="lg:col-span-1 bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-56" />
          </div>

          {/* 5 Quick Link Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-base border border-grey-medium/10">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          ))}

          {/* Upcoming Jobs Widget Skeleton */}
          <div className="border border-grey-medium/10 rounded-base p-4 flex flex-col gap-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-base" />
                <div className="flex flex-col gap-1 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
