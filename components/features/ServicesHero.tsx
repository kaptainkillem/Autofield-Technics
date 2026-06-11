import Link from 'next/link'

interface ServicesHeroProps {
  title: string
  description?: string
  showQuoteButton?: boolean
  ctaText?: string
  ctaHref?: string
}

export function ServicesHero({
  title,
  description,
  showQuoteButton = false,
  ctaText,
  ctaHref,
}: ServicesHeroProps) {
  return (
    <section className="bg-grey-light px-4 pt-16 md:px-20 md:pt-20">
      <div className="mx-auto max-w-6xl flex flex-col items-center text-center justify-center min-h-[280px]">
        <h1 className="heading-1 mb-4">{title}</h1>
        {description && (
          <p className="text-white max-w-2xl mb-8">
            {description}
          </p>
        )}
        {showQuoteButton && !ctaText && (
          <Link href="/quote" className="btn-primary inline-block">
            Get a Free Quote
          </Link>
        )}
        {ctaText && ctaHref && (
          <Link href={ctaHref} className="btn-primary inline-block">
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  )
}