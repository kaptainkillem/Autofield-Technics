import React, { ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'
import { SiteLogo } from './SiteLogo'
import { SITE_CONFIG, replaceVars, buildFooterTagline } from '@/lib/site-config'

interface FooterProps extends ComponentPropsWithoutRef<'footer'> {}

export const Footer: React.FC<FooterProps> = ({
  className,
  ...props
}) => {
  const { footer, contact, socialMedia, business, navigation } = SITE_CONFIG

  const socialEntries = Object.entries(socialMedia).filter(
    ([, url]) => !!url
  ) as [string, string][]

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
            {buildFooterTagline()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              {navigation.footerQuick.map((link) => (
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

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Contact</h3>
            <div className="flex flex-col gap-2 text-small text-white/80">
              <a href={`tel:${SITE_CONFIG.phone}`} className="no-underline font-bold text-white/80 hover:text-white transition-colors duration-200">
                {SITE_CONFIG.phone}
              </a>

              {footer.showEmail && contact.email && (
                <a href={`mailto:${contact.email}`} className="no-underline font-bold text-white/80 hover:text-white transition-colors duration-200">
                  {contact.email}
                </a>
              )}

              <a
                href={SITE_CONFIG.address.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline font-bold text-white/80 hover:text-white transition-colors duration-200"
              >
                {SITE_CONFIG.address.street}, {SITE_CONFIG.address.area},<br />{SITE_CONFIG.city}, {SITE_CONFIG.address.countryFull}
              </a>

              <Link
                href="/quote"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-base px-3 py-1.5 text-white text-xs font-medium w-fit no-underline transition-colors duration-200"
              >
                {SITE_CONFIG.serviceTagline}
              </Link>

              {/* Social Media Icons */}
              {footer.showSocial && socialEntries.length > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  {socialEntries.map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={platform}
                      className="text-white/80 hover:text-white transition-colors duration-200"
                    >
                      {platform === 'facebook' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      )}
                      {platform === 'instagram' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      )}
                      {platform === 'linkedin' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      )}
                      {platform === 'twitter' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      )}
                      {platform === 'tiktok' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1.01.03-1.51.19-1.95 1.08-3.77 2.52-5.04 1.46-1.35 3.41-2.06 5.41-2.09.78-.01 1.57.08 2.32.29v4.13c-.64-.23-1.32-.35-2.01-.34-1.41.03-2.78.75-3.61 1.89-.62.84-.91 1.89-.88 2.94.02.74.19 1.48.52 2.14.53 1.02 1.47 1.78 2.58 2.08.74.21 1.53.19 2.27-.06.89-.3 1.65-.91 2.11-1.72.23-.41.39-.86.47-1.32.02-.15.02-.31.02-.46V.02h.01z"/></svg>
                      )}
                      {platform === 'youtube' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Legal</h3>
            <nav className="flex flex-col gap-2">
              {navigation.footerLegal.map((link) => (
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
            {footer.showCompanyReg && business.companyRegistration && (
              <span className="block mt-1 text-xs">
                Reg: {business.companyRegistration}
                {business.vatNumber && ` | VAT: ${business.vatNumber}`}
              </span>
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
