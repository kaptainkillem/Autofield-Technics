import React, { ComponentPropsWithoutRef } from 'react';
import { SiteLogo } from './SiteLogo';
import { SITE_CONFIG } from '@/lib/site-config';

interface FooterProps extends ComponentPropsWithoutRef<'footer'> {}

const QUICK_LINKS = [
  { label: 'Request a Quote', href: '/quote' },
  { label: 'Services', href: '/services' },
  { label: 'Reviews', href: '/reviews' },
] as const;

/**
 * Footer - Site footer with brand, links, and contact info
 *
 * @example
 * <Footer />
 */
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
            Qualified mechanic with 15+ years of experience. Specializing in Korean brands (Suzuki, Hyundai) and general repairs across Johannesburg.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-small text-white/80 no-underline font-bold hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold tracking-wide">Contact</h3>
            <div className="flex flex-col gap-2 text-small text-white/80">
              <a href="tel:0784802796" className="no-underline font-bold text-white/80 hover:text-white transition-colors duration-200">
                078 480 2796
              </a>
              <a
                href="https://www.google.com/maps/search/50+Main+Street+Marshalltown+Johannesburg+South+Africa"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline font-bold text-white/80 hover:text-white transition-colors duration-200"
              >
                50 Main Street, Marshalltown,<br />Johannesburg, South Africa
              </a>
              <a
                href="/quote"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-base px-3 py-1.5 text-white text-xs font-medium w-fit no-underline transition-colors duration-200"
              >
                Mobile + Workshop Service
              </a>
            </div>
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
  );
};

export default Footer;
