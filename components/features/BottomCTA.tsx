import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function BottomCTA() {
  return (
    <section className="bg-grey-dark py-20 px-4 mb-8">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
        <h2 className="heading-2 text-white">
          Stop waiting in workshop lobbies.
        </h2>
        <p className="text-lg text-white/80 max-w-2xl">
          Get your car fixed today right where you parked.
        </p>
        <Link href="/quote">
          <Button variant="primary" className="flex items-center gap-2 text-lg px-8 py-3">
            Get a Free Quote
            <ArrowRight size={20} />
          </Button>
        </Link>
      </div>
    </section>
  )
}

export default BottomCTA
