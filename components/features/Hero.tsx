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
      className={`bg-grey-light px-4 pt-28 pb-20 md:px-20 md:pt-32 md:pb-20 ${className ?? ''}`}
      {...props}
    >
      <div
        className={`mx-auto max-w-6xl flex flex-col items-center text-center justify-center gap-6 ${
          showImage ? 'md:grid md:grid-cols-2 md:text-left md:items-start md:justify-normal' : ''
        }`}
      >
        <div className="flex flex-col items-center md:items-start gap-6 w-full">
          <h1 className="heading-1">{title}</h1>
          <p className="text-base font-normal heading-1">{description}</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {primaryCTA.href ? (
              <Link href={primaryCTA.href} className="w-full sm:w-auto">
                <Button variant="primary" onClick={primaryCTA.onClick} className="w-full sm:w-auto">
                  {primaryCTA.label}
                </Button>
              </Link>
            ) : (
              <Button variant="primary" onClick={primaryCTA.onClick} className="w-full sm:w-auto">
                {primaryCTA.label}
              </Button>
            )}
            {secondaryCTA && (
              secondaryCTA.href ? (
                <Link href={secondaryCTA.href} className="w-full sm:w-auto">
                  <Button variant="secondary" onClick={secondaryCTA.onClick} className="w-full sm:w-auto">
                    {secondaryCTA.label}
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" onClick={secondaryCTA.onClick} className="w-full sm:w-auto">
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