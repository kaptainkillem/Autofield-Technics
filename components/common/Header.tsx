'use client';

import React, { ComponentPropsWithoutRef, useState } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { SiteLogo } from './SiteLogo';

interface HeaderProps extends ComponentPropsWithoutRef<'header'> {}

const NAV_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Emergency Assist', href: 'tel:0123456789' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Get a Quote', href: '/quote' },
] as const;

/**
 * Header - Floating navigation bar with mobile sidebar
 *
 * @example
 * <Header />
 */
export const Header: React.FC<HeaderProps> = ({
  className,
  ...props
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-primary text-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <span className="text-base font-semibold">Menu</span>
          <button
            type="button"
            className="text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className="text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <span className="text-sm text-white/70">Guest</span>
        </div>

        <nav className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-white no-underline text-base font-bold tracking-wide hover:bg-white/10 rounded-base px-3 py-3 transition-colors duration-200"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="px-4 pt-2 pb-4">
          <Link
            href="/signin"
            className="flex items-center justify-center gap-2 bg-white text-primary font-semibold rounded-base px-4 py-3 hover:bg-white/90 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </div>
      </aside>

      <header
        className={`absolute top-0 left-0 right-0 lg:left-60 lg:right-60 z-50 bg-primary/90 backdrop-blur-sm text-white rounded-b-xl shadow-md ${className ?? ''}`}
        {...props}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center">
            <a href="/" className="no-underline tracking-widest uppercase text-lg font-bold text-white whitespace-nowrap">
              <SiteLogo />
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white no-underline text-base font-bold tracking-wide hover:text-white/80 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              href="/signin"
              className="hidden md:inline-flex items-center gap-2 border-2 border-white text-white font-semibold rounded-base px-4 py-2 hover:bg-white hover:text-primary transition-all duration-200"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>

            <div className="hidden md:flex w-10 h-10 min-w-10 min-h-10 rounded-full bg-white/20 items-center justify-center overflow-hidden ml-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                className="text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <button
              type="button"
              className="md:hidden text-white shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
