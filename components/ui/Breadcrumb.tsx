import Link from 'next/link'

interface BreadcrumbSegment {
  label: string
  href?: string
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[]
}

export function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-grey mb-0">
      <ol className="flex items-center flex-wrap gap-1">
        {segments.map((seg, i) => (
          <li key={i} className="flex items-center">
            {i > 0 && <span className="mx-2 text-grey-medium">&gt;</span>}
            {seg.href ? (
              <Link
                href={seg.href}
                className="text-primary no-underline hover:underline"
              >
                {seg.label}
              </Link>
            ) : (
              <span className="text-grey">{seg.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
