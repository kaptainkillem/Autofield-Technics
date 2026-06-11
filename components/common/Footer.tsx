import React, { ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'
import { SiteLogo } from './SiteLogo'
import { SITE_CONFIG } from '@/lib/site-config'

interface FooterProps extends ComponentPropsWithoutRef<'footer'> {}

const QUICK_LINKS = [
  { label: 'Request a Quote', href: '/quote' },
  { label: 'Services', href: '/services' },
  { label: 'Reviews', href: '/reviews' },
] as const

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
] as const

export const Footer: React.FC<FooterProps> = ({
  className,
  ...props
}) => {
  return (
    <footer
      className={`bg-primary text-white mt-8 ${className ?? ''}`}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col gap-4">
          <span className="tracking-widest uppercase text-xl font-bold">
            <SiteLogo />
          </span>
          <p className="text-small text-white/80 m-0">
            Qualified mechanic with 15+ years of experience. Specializing in Korean brands (Suzuki, Hyundai) and general repairs across {SITE_CONFIG.city}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-small text-white/80 no-underline font-bold hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Contact</h3>
            <div className="flex flex-col gap-2 text-small text-white/80">
              <a href={`tel:${SITE_CONFIG.phone}`} className="no-underline font-bold text-white/80 hover:text-white transition-colors duration-200">
                {SITE_CONFIG.phone}
              </a>
              <a
                href="https://www.google.com/maps/search/50+Main+Street+Marshalltown+Johannesburg+South+Africa"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline font-bold text-white/80 hover:text-white transition-colors duration-200"
              >
                50 Main Street, Marshalltown,<br />Johannesburg, South Africa
              </a>
              <Link
                href="/quote"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-base px-3 py-1.5 text-white text-xs font-medium w-fit no-underline transition-colors duration-200"
              >
                Mobile + Workshop Service
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Legal</h3>
            <nav className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-small text-white/80 no-underline font-bold hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-small text-white/60 text-center m-0">
            &copy; 2026 {SITE_CONFIG.name}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer