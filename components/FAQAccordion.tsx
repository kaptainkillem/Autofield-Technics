'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
}

interface FAQAccordionProps {
  faqs: FAQ[]
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col gap-2">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id
        return (
          <div
            key={faq.id}
            className={`bg-white border rounded-base overflow-hidden transition-all ${
              isOpen ? 'border-primary/20 shadow-sm' : 'border-grey-medium/10'
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-grey-lightest transition-colors"
            >
              <span className={`text-sm font-semibold ${isOpen ? 'text-primary' : 'text-grey-dark'}`}>
                {faq.question}
              </span>
              <ChevronDown
                size={16}
                className={`text-grey-medium shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4">
                <p className="text-sm text-grey leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
