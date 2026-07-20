'use client'

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { sanitizeText, sanitizePhone, sanitizeEmail } from '@/lib/input-sanitizer'
import { Loader2, Save, Type, Phone, MapPin, Mail, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

const WebsiteCopySchema = z.object({
  site_name: z.string().min(1, 'Business name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  city: z.string().min(1, 'City is required').max(100),
  hero_title: z.string().min(1, 'Hero title is required').max(200),
  hero_description: z.string().min(1, 'Hero description is required').max(500),
  contact_email: z.string().email('Invalid email address'),
})

type WebsiteCopyFormData = z.infer<typeof WebsiteCopySchema>

interface WebsiteCopyFormProps {
  initialData: WebsiteCopyFormData
  workshopId: string | null
  onSaved?: () => void
}

export function WebsiteCopyForm({ initialData, workshopId, onSaved }: WebsiteCopyFormProps) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof WebsiteCopyFormData, string>>>({})
  const [form, setForm] = useState<WebsiteCopyFormData>(initialData)

  function handleChange(field: keyof WebsiteCopyFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = WebsiteCopySchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof WebsiteCopyFormData, string>> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof WebsiteCopyFormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setSaving(true)

    const { error } = await (supabase as any)
      .from('business_settings')
      .upsert({
        workshop_id: workshopId,
        site_name: sanitizeText(form.site_name),
        phone: sanitizePhone(form.phone),
        city: sanitizeText(form.city),
        hero_title: sanitizeText(form.hero_title),
        hero_description: sanitizeText(form.hero_description),
        contact_email: sanitizeEmail(form.contact_email),
      })

    setSaving(false)

    if (error) {
      console.error('Website copy save error:', error)
      toast.error('Failed to save. Please try again.')
      return
    }

    toast.success('Website copy updated! Refresh the homepage to see changes.')
    onSaved?.()
  }

  const fields = [
    { key: 'site_name' as const, label: 'Business Name', icon: Type, placeholder: 'Autofields Technics' },
    { key: 'phone' as const, label: 'Phone Number', icon: Phone, placeholder: '+27784802796' },
    { key: 'city' as const, label: 'City / Service Area', icon: MapPin, placeholder: 'Johannesburg' },
    { key: 'contact_email' as const, label: 'Contact Email', icon: Mail, placeholder: 'info@autofieldstechnics.co.za' },
    { key: 'hero_title' as const, label: 'Homepage Hero Title', icon: FileText, placeholder: 'Professional Mechanical Care, Wherever You Are' },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {fields.map(({ key, label, icon: Icon, placeholder }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
            <Icon size={14} />
            {label}
          </label>
          <input
            type="text"
            value={form[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
          {errors[key] && <p className="text-xs text-error">{errors[key]}</p>}
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
          <FileText size={14} />
          Homepage Hero Description
        </label>
        <textarea
          value={form.hero_description}
          onChange={(e) => handleChange('hero_description', e.target.value)}
          placeholder="From emergency roadside assistance to expert workshop repairs in {city}."
          rows={3}
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
        />
        {errors.hero_description && <p className="text-xs text-error">{errors.hero_description}</p>}
        <p className="text-[11px] text-grey-medium">
          Use {'{city}'} as a placeholder — it will be replaced with the city name automatically.
        </p>
      </div>

      <div className="sticky bottom-4 mt-2 bg-white border border-grey-medium/10 rounded-base p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-grey-dark">Unsaved changes?</span>
          <span className="text-xs text-grey">Changes appear on the homepage after refresh</span>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-primary text-white font-bold py-2.5 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </Button>
      </div>
    </form>
  )
}
