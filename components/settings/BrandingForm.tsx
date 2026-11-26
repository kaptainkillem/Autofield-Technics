
'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { sanitizeText } from '@/lib/input-sanitizer'
import { saveSuperAdminSettings } from '@/lib/settings-api'
import { toast } from 'sonner'
import { Palette, Upload, Save, Loader2, ImageIcon, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { allowedFontFamilies } from '@/lib/homepage-content'
import { ThemeCustomizerPreview, type ThemePreviewValue } from '@/components/settings/ThemeCustomizerPreview'

interface BrandingSettings extends ThemePreviewValue {
  accent_color: string
  secondary_text_color: string | null
  favicon_url: string | null
  logo_url: string | null
  font_family: string | null
}

const DEFAULT_THEME: ThemePreviewValue = {
  primary_color: '#3B82F6',
  heading_color: '#111827',
  primary_text_color: '#111827',
  subtext_color: '#595959',
  hero_bg_color: '#E8E8E8',
  hero_text_color: '#111827',
}

interface BrandingFormProps {
  settings: BrandingSettings
  workshopId: string | null
  onUpdate: (settings: BrandingSettings) => void
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export function BrandingForm({ settings, workshopId, onUpdate }: BrandingFormProps) {
  const [form, setForm] = useState<BrandingSettings>({
    primary_color: settings.primary_color ?? '#3B82F6',
    accent_color: settings.accent_color ?? '#10B981',
    heading_color: settings.heading_color ?? '#111827',
    primary_text_color: settings.primary_text_color ?? '#111827',
    secondary_text_color: settings.secondary_text_color ?? '#595959',
    subtext_color: settings.subtext_color ?? '#595959',
    hero_bg_color: settings.hero_bg_color ?? '#E8E8E8',
    hero_text_color: settings.hero_text_color ?? '#111827',
    favicon_url: settings.favicon_url ?? null,
    logo_url: settings.logo_url ?? null,
    font_family: settings.font_family ?? 'Inter',
  })

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'favicon' | 'logo' | null>(null)

  const faviconInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    if (!workshopId) return

    setSaving(true)

    try {
      await saveSuperAdminSettings(workshopId, {
        primary_color: sanitizeText(form.primary_color),
        accent_color: sanitizeText(form.accent_color),
        heading_color: sanitizeText(form.heading_color || '#111827'),
        primary_text_color: sanitizeText(form.primary_text_color || '#111827'),
        secondary_text_color: sanitizeText(form.secondary_text_color || '#595959'),
        subtext_color: sanitizeText(form.subtext_color || '#595959'),
        hero_bg_color: sanitizeText(form.hero_bg_color || '#E8E8E8'),
        hero_text_color: sanitizeText(form.hero_text_color || '#111827'),
        favicon_url: form.favicon_url,
        logo_url: form.logo_url,
        font_family: sanitizeText(form.font_family || 'Inter'),
      })

      onUpdate(form)
      toast.success('Branding saved! Refresh the page to see changes.')
    } catch (err: any) {
      console.error('Save branding error:', err)
      toast.error(err.message || 'Failed to save branding settings')
    } finally {
      setSaving(false)
    }
  }

  function handleResetDefaults() {
    setForm((prev) => ({
      ...prev,
      ...DEFAULT_THEME,
      secondary_text_color: '#595959',
    }))
  }

  async function uploadImage(file: File, path: string) {
    const { error } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (error) {
      console.error('Image upload error:', error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(path)

    return publicUrl
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Favicon must be less than 1MB')
      return
    }

    setUploading('favicon')
    const path = `favicon-${Date.now()}`

    try {
      const publicUrl = await uploadImage(file, path)
      setForm((prev) => ({ ...prev, favicon_url: publicUrl }))
      toast.success('Favicon uploaded')
    } catch {
      toast.error('Failed to upload favicon')
    } finally {
      setUploading(null)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB')
      return
    }

    setUploading('logo')
    const path = `logo-${Date.now()}`

    try {
      const publicUrl = await uploadImage(file, path)
      setForm((prev) => ({ ...prev, logo_url: publicUrl }))
      toast.success('Logo uploaded')
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(null)
    }
  }

  function handleRemoveLogo() {
    setForm((prev) => ({ ...prev, logo_url: null }))

    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">
            Branding & Appearance
          </h3>
          <p className="text-xs text-grey">
            Customize your shop colors, favicon, and site logo.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          aria-disabled={saving}
          aria-busy={saving}
          className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? 'Saving...' : 'Save Branding'}</span>
        </Button>
      </div>

      {/* Accent Color */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
          <Palette size={12} />
          Accent Color
        </label>

        <div className="flex items-center gap-3">
          {/* Native color picker retained */}
          <input
            type="color"
            value={form.accent_color}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                accent_color: e.target.value,
              }))
            }
            className="w-12 h-10 rounded-base border border-grey-medium/20 cursor-pointer"
          />

          {/* Migrated to reusable Input */}
          <Input
            type="text"
            value={form.accent_color}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                accent_color: e.target.value,
              }))
            }
            className="w-28 font-mono"
          />

          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    accent_color: c,
                  }))
                }
                className="w-6 h-6 rounded-full border border-grey-light/50 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
          <Type size={12} />
          Font Family
        </label>

        {/* Migrated to reusable Select */}
        <Select
          value={form.font_family || 'Inter'}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              font_family: e.target.value,
            }))
          }
          className="w-full max-w-xs"
        >
          {allowedFontFamilies.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </Select>

        <p className="text-[10px] text-grey-medium">
          Choose a font that matches your brand personality. The site will load the selected font automatically.
        </p>
      </div>

      {/* Theme Colors + Live Preview */}
      <div className="bg-grey-lightest rounded-base p-4 border border-grey-light flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold text-grey-dark uppercase tracking-wide">
            Theme Colors & Live Preview
          </p>
          <p className="text-[11px] text-grey-medium mt-1">
            Customize every color the public site uses. Changes preview before you save.
          </p>
        </div>

        <ThemeCustomizerPreview
          value={form}
          defaults={DEFAULT_THEME}
          onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
          onReset={handleResetDefaults}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Favicon Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide">
            Favicon
          </label>

          <div className="flex items-center gap-4">
            {form.favicon_url ? (
              <img
                src={form.favicon_url}
                alt="Favicon preview"
                className="h-10 w-10 object-contain rounded-base border border-grey-light bg-white"
              />
            ) : (
              <div className="h-10 w-10 rounded-base border border-grey-light bg-grey-lightest flex items-center justify-center">
                <ImageIcon size={20} className="text-grey-medium" />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/x-icon,image/svg+xml"
                onChange={handleFaviconUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploading === 'favicon'}
                className="flex items-center gap-2 px-4 py-2 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {uploading === 'favicon' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}

                {uploading === 'favicon' ? 'Uploading...' : 'Upload Favicon'}
              </button>

              <p className="text-[10px] text-grey-medium">
                PNG, ICO, or SVG. Max 1MB.
              </p>
            </div>
          </div>
        </div>

        {/* Site Logo Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide">
            Site Logo
          </label>

          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Site logo preview"
                className="h-16 w-16 object-contain rounded-base border border-grey-light bg-white p-1"
              />
            ) : (
              <div className="h-16 w-16 rounded-base border border-grey-light bg-grey-lightest flex items-center justify-center">
                <ImageIcon size={24} className="text-grey-medium" />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading === 'logo'}
                  className="flex items-center gap-2 px-4 py-2 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {uploading === 'logo' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}

                  {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
                </button>

                {form.logo_url && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-2 rounded-base border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              <p className="text-[10px] text-grey-medium">
                PNG, JPG, or SVG. Max 2MB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}