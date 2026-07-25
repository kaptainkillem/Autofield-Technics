import React from 'react'
import { DynamicIcon } from '@/components/common/DynamicIcon'

interface Step {
  heading: string
  description: string
  iconName: string
}

interface HowItWorksProps {
  title: string
  subtitle: string
  steps: Step[]
}

export function HowItWorks({ title, subtitle, steps }: HowItWorksProps) {
  if (!steps || steps.length === 0) return null

  return (
    <section className="bg-grey-lightest py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-grey-dark mb-4">{title}</h2>
          <p className="text-body max-w-2xl mx-auto">{subtitle}</p>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="snap-start shrink-0 w-[280px] md:shrink-0 md:w-auto flex flex-col items-center text-center gap-4 p-6 bg-white rounded-base border border-grey-medium/10 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <DynamicIcon name={step.iconName} size={32} className="text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                {index + 1}
              </div>
              <h3 className="heading-4">{step.heading}</h3>
              <p className="text-body text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
