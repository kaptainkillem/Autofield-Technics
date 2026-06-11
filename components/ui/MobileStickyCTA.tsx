'use client'

import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface MobileStickyCTAProps {
  title: string
  subtitle?: string | React.ReactNode
  buttonText?: string
  href?: string
  onClick?: () => void
  icon?: LucideIcon
  mobileScrollThreshold?: number
  desktopScrollThreshold?: number
}

export function MobileStickyCTA({
  title,
  subtitle,
  buttonText = 'Get Free Quotes',
  href,
  onClick,
  icon: Icon = ArrowRight,
  mobileScrollThreshold = 150,
  desktopScrollThreshold = 100,
}: MobileStickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [isFooterVisible, setIsFooterVisible] = useState(false)
  const footerObserverRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    const handleScroll = () => {
      const threshold = isMobile ? mobileScrollThreshold : desktopScrollThreshold
      const scrolledPastThreshold = window.scrollY > threshold
      setIsVisible(scrolledPastThreshold && !isFooterVisible)
    }

    const setupFooterObserver = () => {
      if (footerObserverRef.current) {
        footerObserverRef.current.disconnect()
      }

      const footer = document.querySelector('footer')
      if (!footer) return

      footerObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsFooterVisible(entry.isIntersecting)
          })
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px',
        }
      )

      footerObserverRef.current.observe(footer)
    }

    checkMobile()
    handleScroll()
    setupFooterObserver()

    window.addEventListener('resize', checkMobile, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('scroll', handleScroll)
      if (footerObserverRef.current) {
        footerObserverRef.current.disconnect()
      }
    }
  }, [isMobile, isFooterVisible, mobileScrollThreshold, desktopScrollThreshold])

  useEffect(() => {
    const threshold = isMobile ? mobileScrollThreshold : desktopScrollThreshold
    const scrolledPastThreshold = window.scrollY > threshold
    setIsVisible(scrolledPastThreshold && !isFooterVisible)
  }, [isFooterVisible, isMobile, mobileScrollThreshold, desktopScrollThreshold])

  const renderButtonContent = () => (
    <>
      {buttonText}
      <Icon className="w-4 h-4 animate-pulse shrink-0" />
    </>
  )

  const buttonClasses =
    'flex-1 md:flex-none btn-primary py-3 px-4 md:px-5 rounded-base text-sm flex items-center justify-center gap-2 font-bold shadow-md transition-all select-none whitespace-nowrap active:scale-[0.97]'

  return (
    <div
      className={`
        fixed z-[var(--z-sticky)] transition-all duration-300 ease-out
        bottom-0 left-0 right-0
        md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2
        md:w-full md:max-w-2xl
      `}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div
        className="md:hidden bg-grey-lightest px-4 py-4"
        style={{
          boxShadow: '0 -4px 24px -4px rgba(0, 0, 0, 0.1), 0 -2px 8px -2px rgba(0, 0, 0, 0.06)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0 flex-1">
            {title && (
              <span className="text-xs font-bold text-grey uppercase tracking-wider truncate">
                {title.length > 20 ? title.slice(0, 20) + '...' : title}
              </span>
            )}
            {subtitle && typeof subtitle === 'string' && (
              <span className="text-sm font-medium text-grey-dark truncate mt-0.5">
                {subtitle}
              </span>
            )}
            {subtitle && typeof subtitle !== 'string' && (
              <div className="mt-0.5 min-w-0">{subtitle}</div>
            )}
          </div>

          {href ? (
            <Link href={href} className={buttonClasses}>
              {renderButtonContent()}
            </Link>
          ) : (
            <button type="button" onClick={onClick} className={buttonClasses}>
              {renderButtonContent()}
            </button>
          )}
        </div>
      </div>

      <div
        className="hidden md:block bg-grey-lightest rounded-base px-6 py-3"
        style={{
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(91, 155, 213, 0.2)',
        }}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            {title && (
              <span className="text-xs font-bold text-grey uppercase tracking-wider">
                {title}
              </span>
            )}
            {subtitle && typeof subtitle === 'string' && (
              <span className="text-sm font-medium text-grey-dark">
                {subtitle}
              </span>
            )}
            {subtitle && typeof subtitle !== 'string' && (
              <div className="min-w-0">{subtitle}</div>
            )}
          </div>

          {href ? (
            <Link href={href} className={buttonClasses}>
              {renderButtonContent()}
            </Link>
          ) : (
            <button type="button" onClick={onClick} className={buttonClasses}>
              {renderButtonContent()}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}