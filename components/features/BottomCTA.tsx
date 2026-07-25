import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface BottomCTAProps {
  heading: string
  description: string
  buttonLabel: string
  buttonHref: string
}

export function BottomCTA({ heading, description, buttonLabel, buttonHref }: BottomCTAProps) {
  return (
    <section className="bg-grey-dark py-20 px-4 ">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
        <h2 className="heading-2 text-white">
          {heading}
        </h2>
        <p className="text-lg text-white/80 max-w-2xl">
          {description}
        </p>
        <Link href={buttonHref}>
          <Button variant="primary" className="flex items-center gap-2 text-lg px-8 py-3">
            {buttonLabel}
            <ArrowRight size={20} />
          </Button>
        </Link>
      </div>
    </section>
  )
}

export default BottomCTA
