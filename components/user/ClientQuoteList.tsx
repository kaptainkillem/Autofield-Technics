'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QuoteDetailModal } from '@/components/ui/QuoteDetailModal'

type Quote = Database['public']['Tables']['quotes']['Row']

interface ClientQuoteListProps {
  quotes: Quote[]
}

export function ClientQuoteList({ quotes }: ClientQuoteListProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  if (quotes.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-base shadow-sm divide-y divide-grey-medium/20">
        {quotes.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedQuote(q)}
            className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <div className="min-w-0">
              <p className="font-semibold text-sm text-grey-dark truncate">
                {q.description?.slice(0, 40) ?? 'General service'}
              </p>
              <p className="text-xs text-grey mt-0.5">
                {new Date(q.created_at).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <StatusBadge status={q.status ?? 'pending'} />
          </button>
        ))}
      </div>

      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </>
  )
}