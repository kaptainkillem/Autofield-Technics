'use client'

import { useMemo } from 'react'

export interface ThemePreviewValue {
  primary_color: string
  heading_color: string | null
  primary_text_color: string | null
  subtext_color: string | null
  hero_bg_color: string | null
  hero_text_color: string | null
}

interface ThemeCustomizerPreviewProps {
  value: ThemePreviewValue
  defaults: ThemePreviewValue
  onChange: (value: ThemePreviewValue) => void
  onReset: () => void
}

const DEFAULT_FALLBACKS: ThemePreviewValue = {
  primary_color: '#3B82F6',
  heading_color: '#111827',
  primary_text_color: '#111827',
  subtext_color: '#595959',
  hero_bg_color: '#E8E8E8',
  hero_text_color: '#111827',
}

function hexToRgb(hex: string) {
  let clean = (hex || '').replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('')
  }
  const value = parseInt(clean, 16)
  if (Number.isNaN(value) || clean.length !== 6) return { r: 0, g: 0, b: 0 }
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const channels = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrastRatio(a: string, b: string) {
  const l1 = relativeLuminance(hexToRgb(a)) + 0.05
  const l2 = relativeLuminance(hexToRgb(b)) + 0.05
  return l1 > l2 ? l1 / l2 : l2 / l1
}

const FIELDS: { key: keyof ThemePreviewValue; label: string; fallback: string }[] = [
  { key: 'primary_color', label: 'Primary', fallback: '#3B82F6' },
  { key: 'heading_color', label: 'Headings', fallback: '#111827' },
  { key: 'primary_text_color', label: 'Primary Text', fallback: '#111827' },
  { key: 'subtext_color', label: 'Subtext', fallback: '#595959' },
  { key: 'hero_bg_color', label: 'Hero Background', fallback: '#E8E8E8' },
  { key: 'hero_text_color', label: 'Hero Text', fallback: '#111827' },
]

export function ThemeCustomizerPreview({
  value,
  defaults,
  onChange,
  onReset,
}: ThemeCustomizerPreviewProps) {
  const resolved = {
    primary: value.primary_color || defaults.primary_color || DEFAULT_FALLBACKS.primary_color,
    heading: value.heading_color || defaults.heading_color || DEFAULT_FALLBACKS.heading_color!,
    text: value.primary_text_color || defaults.primary_text_color || DEFAULT_FALLBACKS.primary_text_color!,
    subtext: value.subtext_color || defaults.subtext_color || DEFAULT_FALLBACKS.subtext_color!,
    heroBg: value.hero_bg_color || defaults.hero_bg_color || DEFAULT_FALLBACKS.hero_bg_color!,
    heroText: value.hero_text_color || defaults.hero_text_color || DEFAULT_FALLBACKS.hero_text_color!,
  }

  const heroContrast = useMemo(
    () => contrastRatio(resolved.heroBg, resolved.heroText),
    [resolved.heroBg, resolved.heroText]
  )
  const bodyContrast = useMemo(
    () => contrastRatio('#FFFFFF', resolved.text),
    [resolved.text]
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-3">
        {FIELDS.map(({ key, label, fallback }) => {
          const current = (value[key] as string | null) || defaults[key] || fallback
          return (
            <div key={key} className="flex items-center gap-3">
              <label className="w-32 text-xs font-semibold text-grey-dark uppercase tracking-wide">
                {label}
              </label>
              <input
                type="color"
                value={current}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                className="w-10 h-10 rounded-base border border-grey-medium/20 cursor-pointer bg-white"
                aria-label={`${label} color picker`}
              />
              <input
                type="text"
                value={current}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                className="w-28 rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-[#0D0D0D] bg-white placeholder:text-gray-500 font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                aria-label={`${label} hex value`}
              />
            </div>
          )
        })}
        <button
          type="button"
          onClick={onReset}
          className="self-start text-sm text-primary font-semibold hover:underline"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="flex-1 rounded-base border border-grey-light overflow-hidden bg-white">
        <div
          className="p-6 text-center"
          style={{ backgroundColor: resolved.heroBg, color: resolved.heroText }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: resolved.heroText }}>
            Professional Mechanical Care
          </h2>
          <p className="mb-4" style={{ color: resolved.heroText }}>
            Wherever you are, we keep you moving.
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-base font-semibold text-white"
            style={{ backgroundColor: resolved.primary }}
          >
            Book Now
          </button>
          {heroContrast < 4.5 && (
            <p className="mt-3 inline-block rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-red-600">
              Low hero contrast ({heroContrast.toFixed(2)}:1)
            </p>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold mb-2" style={{ color: resolved.heading }}>
            Our Services
          </h3>
          <p className="mb-3" style={{ color: resolved.text }}>
            From routine maintenance to emergency repairs, we handle it all.
          </p>
          <p className="text-sm" style={{ color: resolved.subtext }}>
            Trusted by drivers across the city.
          </p>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Sample input — type here"
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-[#0D0D0D] bg-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          {bodyContrast < 4.5 && (
            <p className="mt-2 text-[11px] font-semibold text-red-600">
              Low body-text contrast on white ({bodyContrast.toFixed(2)}:1)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
