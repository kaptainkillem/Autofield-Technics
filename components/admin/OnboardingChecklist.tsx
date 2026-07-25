'use client'

import Link from 'next/link'
import { CheckCircle, Circle } from 'lucide-react'

interface OnboardingChecklistProps {
  settings: {
    site_name: string | null
    phone: string | null
    whatsapp_number: string | null
    city: string | null
    logo_url: string | null
    hero_image_url: string | null
    primary_color: string
    accent_color: string
    font_family: string | null
    home_page_content: unknown
    business_hours: string | null
    terms_conditions: string | null
    document_footer: string | null
  }
  hasServices: boolean
}

interface ChecklistItem {
  id: string
  label: string
  done: boolean
  settingsTab?: string
}

export function OnboardingChecklist({ settings, hasServices }: OnboardingChecklistProps) {
  const isColorDefault = (color: string, def: string) =>
    color === def || color.toLowerCase() === def.toLowerCase()

  const homePageModified = (() => {
    if (!settings.home_page_content || typeof settings.home_page_content !== 'object') return false
    const h = settings.home_page_content as Record<string, unknown>
    const hero = (h.hero as Record<string, unknown> | undefined)
    if (!hero) return false
    return hero.title !== 'Professional Mechanical Care, Wherever You Are'
  })()

  const items: ChecklistItem[] = [
    { id: 'name', label: 'Business name', done: !!settings.site_name && settings.site_name !== 'Autofields Technics', settingsTab: 'business' },
    { id: 'phone', label: 'Phone number', done: !!settings.phone && settings.phone !== '+27784802796', settingsTab: 'business' },
    { id: 'whatsapp', label: 'WhatsApp number', done: !!settings.whatsapp_number, settingsTab: 'whatsapp' },
    { id: 'city', label: 'City / service area', done: !!settings.city && settings.city !== 'Johannesburg', settingsTab: 'business' },
    { id: 'logo', label: 'Logo uploaded', done: !!settings.logo_url, settingsTab: 'branding' },
    { id: 'hero', label: 'Hero image set', done: !!settings.hero_image_url || homePageModified, settingsTab: 'homepage_content' },
    { id: 'colors', label: 'Brand colors customized', done: !isColorDefault(settings.primary_color, '#3B82F6') || !isColorDefault(settings.accent_color, '#10B981'), settingsTab: 'branding' },
    { id: 'font', label: 'Font selected', done: !!settings.font_family && settings.font_family !== 'Inter', settingsTab: 'branding' },
    { id: 'homepage', label: 'Homepage content reviewed', done: homePageModified, settingsTab: 'homepage_content' },
    { id: 'services', label: 'Services added', done: hasServices, settingsTab: 'website_copy' },
    { id: 'hours', label: 'Business hours set', done: !!settings.business_hours, settingsTab: 'working_hours' },
    { id: 'legal', label: 'Legal terms or footer set', done: !!(settings.terms_conditions || settings.document_footer), settingsTab: 'legal' },
  ]

  const completed = items.filter((i) => i.done).length
  const total = items.length
  const pct = Math.round((completed / total) * 100)

  if (pct >= 100) return null

  return (
    <div className="bg-white border border-primary/20 rounded-base p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">Onboarding Progress</h3>
          <p className="text-xs text-grey">Complete these steps to fully configure your workshop.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-primary">{pct}%</span>
          <span className="text-xs text-grey block">{completed} of {total} done</span>
        </div>
      </div>

      <div className="w-full bg-grey-lightest rounded-full h-2 mb-4">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {items.map((item) => (
          item.settingsTab ? (
            <Link
              key={item.id}
              href={`/dashboard/admin/settings?tab=${item.settingsTab}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-base text-xs font-medium transition-colors no-underline ${
                item.done
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-grey-lightest text-grey hover:bg-primary/5 hover:text-primary border border-grey-light'
              }`}
            >
              {item.done ? <CheckCircle size={14} className="text-green-600 shrink-0" /> : <Circle size={14} className="shrink-0" />}
              {item.label}
            </Link>
          ) : (
            <span
              key={item.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-base text-xs font-medium ${
                item.done
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-grey-lightest text-grey border border-grey-light'
              }`}
            >
              {item.done ? <CheckCircle size={14} className="text-green-600 shrink-0" /> : <Circle size={14} className="shrink-0" />}
              {item.label}
            </span>
          )
        ))}
      </div>
    </div>
  )
}
