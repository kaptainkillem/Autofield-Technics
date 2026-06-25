'use client'

import { useState } from 'react'
import { TableSearch } from '@/components/ui/TableSearch'

interface SearchableListProps<T> {
  items: T[]
  searchFields: (keyof T)[]
  filterField?: keyof T
  filterOptions?: { label: string; value: string }[]
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyDescription: string
  searchPlaceholder?: string
  filterLabel?: string
  countBadges?: React.ReactNode
  header: React.ReactNode
  children: (filteredItems: T[]) => React.ReactNode
}

export function SearchableList<T extends Record<string, unknown>>({
  items,
  searchFields,
  filterField,
  filterOptions,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = 'Search...',
  filterLabel = 'Filter',
  countBadges,
  header,
  children,
}: SearchableListProps<T>) {
  const [search, setSearch] = useState('')
  const [filterVal, setFilterVal] = useState('')

  const filtered = items.filter((item) => {
    const matchesSearch = search === '' || searchFields.some((field) => {
      const val = item[field]
      return String(val ?? '').toLowerCase().includes(search.toLowerCase())
    })

    const matchesFilter = !filterField || filterVal === '' || String(item[filterField] ?? '') === filterVal

    return matchesSearch && matchesFilter
  })

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-grey-light pb-3">
        {header}
        {countBadges}
      </div>
      <div className="mb-4">
        <TableSearch
          placeholder={searchPlaceholder}
          value={search}
          onChange={setSearch}
          filters={filterOptions}
          filterValue={filterVal}
          onFilterChange={setFilterVal}
          filterLabel={filterLabel}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-grey bg-white border border-dashed rounded-base">
          {emptyIcon}
          <p className="font-semibold">{emptyTitle}</p>
          <p className="text-sm text-grey-medium mt-1">{emptyDescription}</p>
        </div>
      ) : (
        children(filtered)
      )}
    </>
  )
}