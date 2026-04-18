'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const LANGUAGES = [
  { value: 'ar', label: 'عربي' },
  { value: 'en', label: 'English' },
  { value: 'both', label: 'ثنائي' },
]

interface PackFiltersProps {
  categories: string[]
  activeCategory?: string
  activeLanguage?: string
}

export function PackFilters({ categories, activeCategory, activeLanguage }: PackFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const applyFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="space-y-3" dir="rtl">
      {/* Category chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x"
        role="group"
        aria-label="تصفية حسب الفئة"
      >
        <FilterChip
          label="الكل"
          active={!activeCategory}
          onClick={() => applyFilter('category', null)}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat}
            label={cat}
            active={activeCategory === cat}
            onClick={() => applyFilter('category', activeCategory === cat ? null : cat)}
          />
        ))}
      </div>

      {/* Language chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x"
        role="group"
        aria-label="تصفية حسب اللغة"
      >
        <FilterChip
          label="كل اللغات"
          active={!activeLanguage}
          onClick={() => applyFilter('language', null)}
        />
        {LANGUAGES.map(({ value, label }) => (
          <FilterChip
            key={value}
            label={label}
            active={activeLanguage === value}
            onClick={() => applyFilter('language', activeLanguage === value ? null : value)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150',
        'min-h-[44px] touch-manipulation whitespace-nowrap',
        active
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/40'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
