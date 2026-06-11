'use client'

import React, { ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface CTAProps {
  label: string
  href?: string
  onClick?: () => void
}

interface HeroProps extends ComponentPropsWithoutRef<'section'> {
  title: string
  description: string
  primaryCTA: CTAProps
  secondaryCTA?: CTAProps
  showImage?: boolean
  imageSrc?: string
}

export const Hero: React.FC<HeroProps> = ({
  title,
  description,
  primaryCTA,
  secondaryCTA,
  showImage = false,
  imageSrc = '/images/hero-image.webp',
  className,
  ...props
}) => {
  return (
    <section
      className={`bg-grey-light px-4 py-20 md:px-20 md:py-20 ${className ?? ''}`}
      {...props}
    >
      <div
        className={`mx-auto max-w-6xl items-center ${
          showImage ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'max-w-4xl'
        }`}
      >
        <div className="flex flex-col gap-6">
          <h1 className="heading-1">{title}</h1>
          <p className="text-base font-normal text-white leading-normal">{description}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {primaryCTA.href ? (
              <Link href={primaryCTA.href}>
                <Button variant="primary" onClick={primaryCTA.onClick}>
                  {primaryCTA.label}
                </Button>
              </Link>
            ) : (
              <Button variant="primary" onClick={primaryCTA.onClick}>
                {primaryCTA.label}
              </Button>
            )}
            {secondaryCTA && (
              secondaryCTA.href ? (
                <Link href={secondaryCTA.href}>
                  <Button variant="secondary" onClick={secondaryCTA.onClick}>
                    {secondaryCTA.label}
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" onClick={secondaryCTA.onClick}>
                  {secondaryCTA.label}
                </Button>
              )
            )}
          </div>
        </div>
        {showImage && (
          <div className="hidden md:flex md:flex-col md:justify-center md:h-full">
            <Image
              src={imageSrc}
              alt={title}
              width={1000}
              height={800}
              className="object-cover rounded-base w-full h-auto"
              loading="eager"
              priority
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default Hero