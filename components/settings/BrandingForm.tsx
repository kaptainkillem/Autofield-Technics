'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { sanitizeText } from '@/lib/input-sanitizer'
import { toast } from 'sonner'
import { Palette, Upload, Save, Loader2, ImageIcon, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BrandingSettings {
  primary_color: string
  accent_color: string
  favicon_url: string | null
}

interface BrandingFormProps {
  settings: BrandingSettings
  onUpdate: (settings: BrandingSettings) => void
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export function BrandingForm({ settings, onUpdate }: BrandingFormProps) {
  const [form, setForm] = useState<BrandingSettings>({
    primary_color: settings.primary_color ?? '#3B82F6',
    accent_color: settings.accent_color ?? '#10B981',
    favicon_url: settings.favicon_url ?? null,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    setSaving(true)
    const { error } = await (supabase as any)
      .from('business_settings')
      .update({
        primary_color: sanitizeText(form.primary_color),
        accent_color: sanitizeText(form.accent_color),
        favicon_url: form.favicon_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'config')

    setSaving(false)

    if (error) {
      console.error('Save branding error:', error)
      toast.error('Failed to save branding settings')
      return
    }

    onUpdate(form)
    toast.success('Branding saved! Refresh the page to see changes.')
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Favicon must be less than 1MB')
      return
    }

    setUploading(true)
    const path = `favicon-${Date.now()}`

    const { error } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (error) {
      console.error('Favicon upload error:', error)
      toast.error('Failed to upload favicon')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(path)

    setForm((prev) => ({ ...prev, favicon_url: publicUrl }))
    setUploading(false)
    toast.success('Favicon uploaded')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">Branding & Appearance</h3>
          <p className="text-xs text-grey">Customize your shop colors and favicon.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          aria-disabled={saving}
          aria-busy={saving}
          className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : 'Save Branding'}</span>
        </Button>
      </div>

      {/* Primary Color */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
          <Palette size={12} />
          Primary Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.primary_color}
            onChange={(e) => setForm((prev) => ({ ...prev, primary_color: e.target.value }))}
            className="w-12 h-10 rounded-base border border-grey-medium/20 cursor-pointer"
          />
          <input
            type="text"
            value={form.primary_color}
            onChange={(e) => setForm((prev) => ({ ...prev, primary_color: e.target.value }))}
            className="w-28 rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-grey-dark font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, primary_color: c }))}
                className="w-6 h-6 rounded-full border border-grey-light/50 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
          <Palette size={12} />
          Accent Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.accent_color}
            onChange={(e) => setForm((prev) => ({ ...prev, accent_color: e.target.value }))}
            className="w-12 h-10 rounded-base border border-grey-medium/20 cursor-pointer"
          />
          <input
            type="text"
            value={form.accent_color}
            onChange={(e) => setForm((prev) => ({ ...prev, accent_color: e.target.value }))}
            className="w-28 rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-grey-dark font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, accent_color: c }))}
                className="w-6 h-6 rounded-full border border-grey-light/50 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-grey-lightest rounded-base p-4 border border-grey-light flex flex-col gap-3">
        <p className="text-xs font-bold text-grey-dark uppercase tracking-wide">Live Preview</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-base text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: form.primary_color }}
          >
            Primary Button
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-base text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: form.accent_color }}
          >
            Accent Button
          </button>
          <span
            className="text-sm font-bold"
            style={{ color: form.primary_color }}
          >
            Primary Text
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: form.accent_color }}
          >
            Accent Text
          </span>
        </div>
      </div>

      {/* Favicon Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-grey uppercase tracking-wide">Favicon</label>
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
              ref={fileInputRef}
              type="file"
              accept="image/png,image/x-icon,image/svg+xml"
              onChange={handleFaviconUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading...' : 'Upload Favicon'}
            </button>
            <p className="text-[10px] text-grey-medium">PNG, ICO, or SVG. Max 1MB.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
