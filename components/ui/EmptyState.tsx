import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateAction {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actions?: EmptyStateAction[]
}

export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="border border-grey-medium/10 bg-grey-lightest rounded-base p-12 text-center max-w-2xl mx-auto flex flex-col items-center gap-4 shadow-sm">
      <div className="p-4 bg-white rounded-full text-primary shadow-sm">
        <Icon size={32} />
      </div>
      <h2 className="text-xl font-bold text-grey-dark">{title}</h2>
      <p className="text-grey text-sm leading-relaxed max-w-md">{description}</p>
      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.variant === 'secondary'
                  ? 'bg-white border border-grey-medium/30 text-grey-dark hover:bg-grey-lightest transition px-6 py-2.5 rounded-base font-semibold text-center'
                  : 'btn-primary px-6 py-2.5 rounded-base font-semibold text-center shadow-md'
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}