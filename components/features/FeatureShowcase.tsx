import React from 'react'

interface Feature {
  heading: string
  text: string
  imageUrl: string
}

const FEATURES: Feature[] = [
  {
    heading: 'The Ultimate Driveway Workshop',
    text: "You don't need to arrange a tow truck or waste your Saturday sitting in a repair shop. Our mobile units arrive at your home or office fully equipped.",
    imageUrl: 'https://images.pexels.com/photos/4489758/pexels-photo-4489758.jpeg',
  },
  {
    heading: 'Transparent, Upfront Pricing',
    text: 'Once we diagnose the issue, you receive a detailed, digital quote sent straight to your phone. We break down the exact cost of parts and labor. No hidden fees.',
    imageUrl: 'https://images.pexels.com/photos/4116221/pexels-photo-4116221.jpeg',
  },
  {
    heading: 'Certified & Guaranteed Expertise',
    text: 'Your vehicle is handled by qualified professionals with deep diagnostic experience. We back our workmanship with a comprehensive guarantee.',
    imageUrl: 'https://images.pexels.com/photos/8478206/pexels-photo-8478206.jpeg',
  },
]

export function FeatureShowcase() {
  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">
        {FEATURES.map((feature, index) => {
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
