'use client'

import { useSiteConfig } from '@/components/providers/SiteConfigProvider'

export function SiteLogo({ className }: { className?: string }) {
  const config = useSiteConfig()
  if (config.logoUrl) {
    return (
      <img
        src={`${config.logoUrl}${config.logoUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(config.name)}`}
        alt={config.name}
        className={`h-8 w-auto object-contain ${className ?? ''}`}
      />
    )
  }
  return (
    <span className={className}>
      {config.nameBold}
      <span className="font-light ml-1">{config.nameLight}</span>
    </span>
  );
}
