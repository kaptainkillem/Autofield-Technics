'use client'

import { useEffect, useState } from 'react'
import { Star, FileText, Wrench, MessageCircle, ArrowRight, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClientQuoteList } from '@/components/user/ClientQuoteList'
import { Database } from '@/types/database'

type Quote = Database['public']['Tables']['quotes']['Row']

type ClientReview = {
  id: string
  rating: number
  comment: string
  status: string
  created_at: string
}

export default function ClientDashboardPage() {
  const router = useRouter()
  
  // Local reactive component state boundaries
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('there')
  const [allQuotes, setAllQuotes] = useState<Quote[]>([])
  const [allReviews, setAllReviews] = useState<ClientReview[]>([])

  useEffect(() => {
    async function initializeClientWorkspace() {
      try {
        // 1. Authenticate user access credentials
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/signin')
          return
        }

        const meta = user.user_metadata ?? {}
        const role = meta.role ?? 'client'
        if (role === 'admin') {
          router.push('/dashboard/admin')
          return
        }

        // Set display name parameters safely
        setName(meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'there')

        // 🚀 2. "Capture & Convert" Check: Claim anonymous quotes from localStorage
        const pendingQuoteId = localStorage.getItem('pending_quote_id')
        if (pendingQuoteId) {
          await (supabase as any)
            .from('quotes')
            .update({ 
              user_id: user.id,
              customer_email: user.email 
            })
            .eq('id', pendingQuoteId)

          // Flush cache storage cleanly right after the database updates
          localStorage.removeItem('pending_quote_id')
        }

        // 3. Parallel query execution retrieval for user statistics 
        const [quotesRes, reviewsRes] = await Promise.all([
          supabase
            .from('quotes')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false }),
          supabase
            .from('reviews')
            .select('id, rating, comment, status, created_at')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
        ])

        setAllQuotes(quotesRes.data ?? [])
        setAllReviews(reviewsRes.data ?? [])
      } catch (error) {
        console.error('Workspace session alignment runtime error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeClientWorkspace()
  }, [router])

  // Overview snapshot metric parameters
  const totalQuotesRequested = allQuotes.length
  const pendingQuotesCount   = allQuotes.filter((q) => q.status === 'pending').length
  const totalReviewsPosted    = allReviews.length

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Wrench className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs font-semibold text-grey">Loading your garage dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      
      {/* Welcome Header Block */}
      <div className="flex flex-col gap-1 border-b border-grey-medium/10 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-grey-dark">Welcome Back, {name}</h1>
        <p className="text-sm text-grey">High-level snapshot profile tracking parameters loop dashboard.</p>
      </div>

      {/* Dynamic Client Metrics Matrix Card Layout */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-1">
          <span className="text-xs font-semibold text-grey uppercase tracking-wider">Total Estimates Requested</span>
          <span className="text-2xl font-black text-grey-dark">{totalQuotesRequested}</span>
        </div>
        <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-1">
          <span className="text-xs font-semibold text-grey uppercase tracking-wider">Pending Approvals</span>
          <span className="text-2xl font-black text-primary">{pendingQuotesCount}</span>
        </div>
        <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-1">
          <span className="text-xs font-semibold text-grey uppercase tracking-wider">Your Shared Reviews</span>
          <span className="text-2xl font-black text-success">{totalReviewsPosted}</span>
        </div>
      </section>

      {/* Split Block Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column Area */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* 📍 Quotes Section Anchor Component Link Mapping */}
          <div id="quotes" className="scroll-mt-20 flex flex-col gap-6 bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-grey-light pb-3">
              <div>
                <h2 className="text-lg font-bold text-grey-dark">Your Quotes Registry</h2>
                <p className="text-xs text-grey">Monitor progress tracking pipelines for your vehicle estimates.</p>
              </div>
            </div>
            {allQuotes.length === 0 ? (
              <div className="text-center py-10">
                <Wrench className="h-10 w-10 text-grey-medium mx-auto mb-3" />
                <p className="text-grey text-sm">No estimates requested yet.</p>
                <Link href="/quote" className="text-primary font-semibold hover:underline mt-2 inline-block text-sm no-underline">
                  Request your first quote &rarr;
                </Link>
              </div>
            ) : (
              <ClientQuoteList quotes={allQuotes} />
            )}
          </div>

          {/* 📍 Reviews Section Anchor Component Link Mapping */}
          <div id="reviews" className="scroll-mt-20 bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
            <div className="border-b border-grey-light pb-3">
              <h2 className="text-lg font-bold text-grey-dark">Your Shared Service Feedback</h2>
              <p className="text-xs text-grey">Moderation state records for your posted reviews.</p>
            </div>
            {allReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-8 w-8 text-grey-medium mx-auto mb-2" />
                <p className="text-grey text-sm">No reviews submitted yet.</p>
                <Link href="/reviews" className="text-primary font-semibold hover:underline mt-1 inline-block text-sm no-underline">
                  Leave a service review &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allReviews.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1.5 p-4 rounded-base bg-white border border-grey-medium/10">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-grey-medium'}
                          />
                        ))}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-grey mt-1 flex-1 leading-normal">{r.comment}</p>
                    <span className="text-[10px] text-grey-medium text-right mt-2 block w-full">
                      {new Date(r.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column Action Sidebar Panel Component Layout */}
        <div className="lg:col-span-1 bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-grey-dark">Workspace Short-routes</h2>
            <p className="text-xs text-grey">Fast entry modules control immediate actions.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link href="/quote" className="flex items-center justify-between p-3 rounded-base bg-primary text-white no-underline hover:bg-primary-dark transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <FileText size={18} />
                <span className="text-sm font-bold">New Repair Request</span>
              </div>
              <ArrowRight size={14} />
            </Link>
            
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '27000000000'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-base bg-white border border-grey-medium/10 text-grey-dark no-underline hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-primary" />
                <span className="text-sm font-semibold">Direct Workshop Support</span>
              </div>
              <ArrowRight size={14} className="text-grey" />
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}