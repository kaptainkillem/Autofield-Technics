'use client'

import { Search, SlidersHorizontal } from 'lucide-react'

interface TableSearchFilter {
  label: string
  value: string
}

interface TableSearchProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  filters?: TableSearchFilter[]
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterLabel?: string
}

export function TableSearch({
  placeholder = 'Search...',
  value,
  onChange,
  filters,
  filterValue,
  onFilterChange,
  filterLabel = 'Filter',
}: TableSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-base border border-grey-light bg-white py-2 pl-9 pr-4 text-sm text-grey-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
        />
      </div>
      {filters && filters.length > 0 && onFilterChange && (
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium pointer-events-none" />
          <select
            value={filterValue ?? ''}
            onChange={(e) => onFilterChange(e.target.value)}
            className="appearance-none rounded-base border border-grey-light bg-white py-2 pl-8 pr-8 text-sm text-grey-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors cursor-pointer h-[38px]"
          >
            <option value="">{filterLabel}</option>
            {filters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}