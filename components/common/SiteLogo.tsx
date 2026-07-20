'use client'

import { useSiteConfig } from '@/components/providers/SiteConfigProvider'

export function SiteLogo({ className }: { className?: string }) {
  const config = useSiteConfig()
  return (
    <span className={className}>
      {config.nameBold}
      <span className="font-light ml-1">{config.nameLight}</span>
    </span>
  );
}
