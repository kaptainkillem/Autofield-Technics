import { SITE_CONFIG } from '@/lib/site-config';

export function SiteLogo({ className }: { className?: string }) {
  return (
    <span className={className}>
      {SITE_CONFIG.nameBold}
      <span className="font-light ml-1">{SITE_CONFIG.nameLight}</span>
    </span>
  );
}
