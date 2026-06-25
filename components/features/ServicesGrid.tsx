import React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DynamicIcon } from '@/components/common/DynamicIcon'
import type { Database } from '@/types/database'

type CategoryRow = Database['public']['Tables']['categories']['Row']

export async function ServicesGrid() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  const items = (categories ?? []) as CategoryRow[]

  if (items.length === 0) {
    return (
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-grey">No service categories available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-grey-dark mb-4">Our Services</h2>
          <p className="text-body max-w-2xl mx-auto">
            Professional mobile mechanics bringing expert repairs and servicing right to your doorstep.
          </p>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid lg:grid-cols-3 lg:gap-6">
          {items.map((cat) => (
            <Link
              key={cat.id}
              href={`/services/${cat.slug}`}
              className="snap-start shrink-0 w-[280px] sm:shrink-0 sm:w-auto bg-primary text-white rounded-base shadow-base p-6 flex flex-col items-center text-center gap-4 no-underline transition-all duration-200 hover:shadow-md hover:-translate-y-1"
            >
              <div className="text-white">
                <DynamicIcon name={cat.icon_name ?? 'Wrench'} size={40} />
              </div>
              <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
              <p className="text-white/80 text-sm">
                Premium mobile {cat.name.toLowerCase()} diagnostics, repairs, and scheduled servicing.
              </p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/services" className="btn-secondary inline-block">
            View All Services
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ServicesGrid
