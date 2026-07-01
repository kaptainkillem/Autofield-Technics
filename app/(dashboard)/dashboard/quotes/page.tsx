'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FileText, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { ClientQuoteList } from '@/components/user/ClientQuoteList'
import { Database } from '@/types/database'

type Quote = Database['public']['Tables']['quotes']['Row']

export default function ClientQuotesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    async function fetchAllQuotes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      const { data } = await supabase
        .from('quotes')
        .select('*')
        .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setQuotes(data ?? [])
      setLoading(false)
    }
    fetchAllQuotes()
  }, [router])

  const filteredQuotes = quotes.filter(q => {
    if (filterStatus === 'all') return true
    return q.status === filterStatus
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <FileText className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1200px] mx-auto w-full mt-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">Your Estimates History</h1>
          <p className="text-xs text-grey">Review, track, and monitor past service request parameters.</p>
        </div>
      </div>

      {/* Filter Tabs Controller */}
      <div className="flex gap-2 border-b border-grey-light pb-px">
        {(['all', 'pending', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              filterStatus === status 
                ? 'border-primary text-primary' 
                : 'border-transparent text-grey hover:text-grey-dark'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-12 text-grey text-sm">
            No matching quotes found in this section.
          </div>
        ) : (
          <ClientQuoteList quotes={filteredQuotes} />
        )}
      </div>
    </div>
  )
}