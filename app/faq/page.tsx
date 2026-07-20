import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getMergedSiteConfig } from '@/lib/get-site-config'
import { FAQAccordion } from '@/components/FAQAccordion'
import { HelpCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const config = await getMergedSiteConfig()
  return {
    title: `Frequently Asked Questions | ${config.name}`,
    description: `Find answers to common questions about ${config.name} mobile mechanic services.`,
  }
}

export default async function FAQPage() {
  const config = await getMergedSiteConfig()
  const supabase = await createSupabaseServerClient()
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const items = faqs ?? []

  // Group by category
  const categories = Array.from(new Set(items.map((f) => f.category)))
  const grouped = categories.map((cat) => ({
    category: cat,
    faqs: items.filter((f) => f.category === cat),
  }))

  return (
    <>
      {/* Hero */}
      <section className="bg-grey-light px-4 pt-16 pb-12 md:px-20 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-4xl flex flex-col items-center text-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center mb-4">
            <HelpCircle size={28} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Frequently Asked Questions</h1>
          <p className="text-white/80 max-w-xl text-sm md:text-base">
            Everything you need to know about our mobile mechanic and workshop services.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-8 p-4 md:p-6 max-w-[900px] mx-auto w-full mt-4 mb-12">
        {grouped.length === 0 ? (
          <div className="bg-white border border-grey-medium/10 rounded-base p-12 text-center shadow-sm">
            <HelpCircle size={32} className="mx-auto mb-3 text-grey-medium" />
            <p className="text-sm text-grey">No FAQs available yet.</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.category} className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-grey-dark uppercase tracking-wide border-b border-grey-light pb-2">
                {group.category}
              </h2>
              <FAQAccordion faqs={group.faqs} />
            </div>
          ))
        )}
      </div>
    </>
  )
}
