'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Overview',     href: '/admin' },
  { label: 'Quotes',       href: '/admin#quotes' },
  { label: 'Appointments', href: '/admin#appointments' },
  { label: 'Customers',    href: '/admin#customers' },
  { label: 'Invoices',     href: '/admin#invoices' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-grey-medium/30 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-10 h-14 flex items-center justify-between">

        <div className="flex items-center gap-2">
          <span className="text-primary font-bold text-lg leading-none">
            Autofield
          </span>
          <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-base text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'text-grey hover:text-primary hover:bg-grey-lightest'
                  : 'text-grey hover:text-primary hover:bg-grey-lightest'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
            AD
          </div>
          <span className="text-sm text-grey hidden md:block">Admin</span>
        </div>

      </div>
    </header>
  )
}