import React from 'react'

interface Feature {
  heading: string
  text: string
  imageUrl: string
}

interface FeatureShowcaseProps {
  title?: string
  subtitle?: string
  features: Feature[]
}

export function FeatureShowcase({ title, subtitle, features }: FeatureShowcaseProps) {
  if (!features || features.length === 0) return null

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">
        {(title || subtitle) && (
          <div className="text-center mb-4">
            {title && <h2 className="text-3xl font-bold text-grey-dark mb-4">{title}</h2>}
            {subtitle && <p className="text-body max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}
        {features.map((feature, index) => {
          const isEven = index % 2 === 0
          return (
            <div
              key={feature.heading}
              className={`flex flex-col md:flex-row gap-8 items-center ${
                isEven ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              <div className="w-full md:w-1/2">
                <img
                  src={feature.imageUrl}
                  alt={feature.heading}
                  className="w-full aspect-[4/3] object-cover rounded-base"
                />
              </div>
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <h2 className="text-24xl font-bold text-grey-dark">{feature.heading}</h2>
                <p className="text-body">{feature.text}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FeatureShowcase
