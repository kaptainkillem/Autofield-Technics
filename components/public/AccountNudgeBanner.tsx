'use client'

import { useEffect, useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const DISMISSED_KEY = 'autofield_account_nudge_dismissed'

export function AccountNudgeBanner({ customerEmail, quoteId }: { customerEmail: string | null; quoteId: string }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY)
    if (stored) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setDismissed(false)
        setVisible(true)
      }
    })
  }, [])

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
    setVisible(false)
  }

  if (!visible || dismissed) return null

  const signupUrl = customerEmail
    ? `/signup?email=${encodeURIComponent(customerEmail)}&quoteId=${encodeURIComponent(quoteId)}`
    : '/signup'

  return (
    <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-4 rounded-base shadow-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3 min-w-0">
        <UserPlus size={20} className="shrink-0 opacity-80" />
        <div className="min-w-0">
          <p className="text-sm font-bold">
            Save this quote and track your repair history
          </p>
          <p className="text-xs text-white/80">
            Create a free account in 30 seconds. Your quote will be waiting for you.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={signupUrl}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-primary text-xs font-bold rounded-base hover:bg-grey-lightest transition-all shadow-sm whitespace-nowrap"
        >
          <UserPlus size={14} />
          Create Free Account
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-base hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
