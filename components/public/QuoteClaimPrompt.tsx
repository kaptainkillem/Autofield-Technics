'use client'

import { Lock, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface QuoteClaimPromptProps {
  quoteId: string
  quoteServiceType?: string | null
  quoteTotal?: number | null
}

const FEATURES = [
  'Accept or decline your quote instantly',
  'Book & reschedule service appointments',
  'Track your full service history',
  'Download PDF quotes & invoices',
  'Get real-time WhatsApp updates',
]

export function QuoteClaimPrompt({ quoteId, quoteServiceType, quoteTotal }: QuoteClaimPromptProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const redirectParam = encodeURIComponent(token ? `${pathname}?token=${token}` : pathname)

  function formatCurrency(value: number) {
    return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="border-t border-grey-light pt-8">
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-base p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center gap-4 max-w-md mx-auto">
          <div className="p-3 bg-primary/10 rounded-full">
            <Lock size={28} className="text-primary" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-grey-dark">Sign in to manage your quote</h3>
            {quoteServiceType && (
              <p className="text-sm text-grey mt-1">
                {quoteServiceType}{quoteTotal ? ` — ${formatCurrency(quoteTotal)}` : ''}
              </p>
            )}
          </div>

          <p className="text-sm text-grey leading-relaxed">
            You&apos;re one step away from accepting your quote and booking your service.
            Create a free account to:
          </p>

          <ul className="w-full space-y-2 text-left">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <CheckCircle size={16} className="text-success shrink-0 mt-0.5" />
                <span className="text-grey-dark">{feature}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-grey italic">No spam. Just your vehicle stuff.</p>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
            <Link href={`/signup?redirect=${redirectParam}`} className="flex-1">
              <Button
                type="button"
                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-base shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
              >
                <ArrowRight size={16} />
                <span>Create Free Account</span>
              </Button>
            </Link>
            <Link href={`/signin?redirect=${redirectParam}`} className="flex-1">
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-white border border-grey-medium/30 text-grey-dark font-bold py-3 px-6 rounded-base hover:bg-grey-lightest transition-all"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-grey">
            Already have an account? Sign in to continue.
          </p>
        </div>
      </div>
    </div>
  )
}
