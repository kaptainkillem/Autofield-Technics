import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

interface StickyServiceSidebarProps {
  categoryName: string
}

export function StickyServiceSidebar({ categoryName }: StickyServiceSidebarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-grey-light px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-black truncate">
            {categoryName}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck size={14} className="text-success" />
            <span className="text-xs text-grey">Verified &amp; Trusted</span>
          </div>
        </div>
        <Link href="/quote" className="btn-primary !text-sm !px-4 !py-2 whitespace-nowrap shrink-0">
          Get a Free Quote
        </Link>
      </div>
    </div>
  )
}
