'use client'

import Link from 'next/link'
import { Wrench, Home, AlertTriangle } from 'lucide-react'
import { useSiteConfig } from '@/components/providers/SiteConfigProvider'

export default function NotFound() {
  const config = useSiteConfig()
  return (
    <div className="min-h-[70vh] bg-grey-lightest flex items-center justify-center px-4 py-16 md:px-20">
      <div className="bg-white max-w-md w-full text-center flex flex-col items-center gap-6 border border-grey-medium/10 rounded-base shadow-sm p-6">
        
        {/* Animated Custom Check Engine Visual */}
        <div className="relative p-5 rounded-full bg-error/10 border border-error/20 text-error animate-pulse">
          <AlertTriangle size={48} />
          <Wrench size={20} className="absolute bottom-3 right-3 text-grey rotate-45" />
        </div>

        {/* Diagnostic Typography */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-error uppercase">
            Diagnostic Trouble Code: 404
          </span>
          <h1 className="text-3xl font-extrabold text-grey-dark tracking-tight">
            Engine Misfire!
          </h1>
          <p className="text-body text-sm leading-relaxed mt-2">
            The page you are looking for has been moved, removed, or never existed.
          </p>
        </div>

        {/* Inspection Report Divider */}
        <div className="w-full border-t border-dashed border-grey-light/60 my-2"></div>

        {/* Recovery Actions Group */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link 
            href="/" 
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-md"
          >
            <Home size={16} />
            <span>Tow to Home</span>
          </Link>
          
          <Link 
            href="/quote" 
            className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold border border-grey-light bg-white text-grey hover:bg-grey-lightest transition-colors"
          >
            <Wrench size={16} className="text-primary" />
            <span>Book a Service</span>
          </Link>
        </div>

      </div>
    </div>
  )
}