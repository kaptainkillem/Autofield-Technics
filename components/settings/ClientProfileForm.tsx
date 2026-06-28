'use client'

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Loader2, User, Phone, MapPin, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name is too long'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number is too long'),
  physical_address: z.string().max(500, 'Address is too long').optional(),
})

type ProfileFormData = z.infer<typeof ProfileSchema>

interface ClientProfileFormProps {
  userId: string
  email: string
  initialData: {
    full_name: string
    phone: string
    physical_address: string
  }
  onSaved?: () => void
}

export function ClientProfileForm({ userId, email, initialData, onSaved }: ClientProfileFormProps) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({})
  const [form, setForm] = useState<ProfileFormData>({
    full_name: initialData.full_name,
    phone: initialData.phone,
    physical_address: initialData.physical_address,
  })

  function handleChange(field: keyof ProfileFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = ProfileSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ProfileFormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setSaving(true)

    const { error } = await (supabase as any)
      .from('profiles')
      .upsert({
        id: userId,
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        physical_address: form.physical_address?.trim() || null,
      })

    setSaving(false)

    if (error) {
      console.error('Profile save error:', error)
      toast.error('Failed to save profile. Please try again.')
      return
    }

    toast.success('Profile updated successfully!')
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Full Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
          <User size={14} />
          Full Name
        </label>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          placeholder="John Doe"
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
        />
        {errors.full_name && (
          <p className="text-xs text-error">{errors.full_name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
          <Phone size={14} />
          Phone Number
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+27 82 000 0000"
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
        />
        {errors.phone && (
          <p className="text-xs text-error">{errors.phone}</p>
        )}
      </div>

      {/* Email (read-only) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
          <Mail size={14} />
          Email Address
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-base border border-grey-light bg-grey-lightest py-2.5 px-3 text-sm text-grey cursor-not-allowed"
        />
        <p className="text-[11px] text-grey-medium">
          Email cannot be changed here. Contact support if you need to update it.
        </p>
      </div>

      {/* Physical Address */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
          <MapPin size={14} />
          Default Physical Address
        </label>
        <textarea
          value={form.physical_address}
          onChange={(e) => handleChange('physical_address', e.target.value)}
          placeholder="123 Main Street, Sandton, Johannesburg"
          rows={3}
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
        />
        {errors.physical_address && (
          <p className="text-xs text-error">{errors.physical_address}</p>
        )}
        <p className="text-[11px] text-grey-medium">
          This is your default dispatch address for mobile mechanic bookings.
        </p>
      </div>

      <div className="sticky bottom-4 mt-2 bg-white border border-grey-medium/10 rounded-base p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-grey-dark">Unsaved changes?</span>
          <span className="text-xs text-grey">Make sure to save your updates</span>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-primary text-white font-bold py-2.5 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </Button>
      </div>
    </form>
  )
}
