import React from 'react'
import { MessageSquare, Wrench, Car } from 'lucide-react'

interface HowItWorksProps {
  city: string
}

interface Step {
  number: number
  heading: string
  description: string
  icon: React.ReactNode
}

const STEPS: Step[] = [
  {
    number: 1,
    heading: 'Get a Quote',
    description:
      'Tell us your car and the problem. We give you a transparent price upfront.',
    icon: <MessageSquare size={32} className="text-primary" />,
  },
  {
    number: 2,
    heading: 'We Come To You',
    description:
      'We arrive at your home or office fully equipped.',
    icon: <Wrench size={32} className="text-primary" />,
  },
  {
    number: 3,
    heading: 'Drive Happy',
    description:
      'Your car is fixed on-site with zero towing fees or workshop waiting rooms.',
    icon: <Car size={32} className="text-primary" />,
  },
]

export function HowItWorks({ city }: HowItWorksProps) {
  return (
    <section className="bg-grey-lightest py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-grey-dark mb-4">How It Works</h2>
          <p className="text-body max-w-2xl mx-auto">
            Getting your car fixed in {city} has never been easier. Here&apos;s how we bring the workshop to you.
          </p>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:gap-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="snap-start shrink-0 w-[280px] md:shrink-0 md:w-auto flex flex-col items-center text-center gap-4 p-6 bg-white rounded-base border border-grey-medium/10 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                {step.icon}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                {step.number}
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
