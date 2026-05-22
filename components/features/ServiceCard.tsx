import Link from 'next/link'
import type { Database } from '@/types/database'

type ServicesRow = Database['public']['Tables']['services']['Row']

interface ServiceCardProps {
  service: ServicesRow
}

export function ServiceCard({ service }: ServiceCardProps) {
  const href = service.category
    ? `/services/${service.category.toLowerCase()}/${service.id}`
    : `/services`

  return (
    <Link
      href={href}
      className="bg-primary text-white rounded-base shadow-base p-6 flex flex-col gap-4 no-underline transition-all duration-200 hover:shadow-md hover:-translate-y-1"
    >
      <h3 className="text-xl font-semibold text-white">{service.name}</h3>

      {service.description && (
        <p className="text-white/80">{service.description}</p>
      )}
    </Link>
  )
}
