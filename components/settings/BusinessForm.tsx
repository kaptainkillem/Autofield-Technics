'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, ImageIcon } from 'lucide-react'

interface BusinessFormProps {
  values: {
    full_name: string
    phone: string
    company_name: string
    address: string
    whatsapp_number: string
    logo_url: string
  }
  onChange: (field: string, value: string) => void
  userId: string
}

export function BusinessForm({ values, onChange, userId }: BusinessFormProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB')
      return
    }

    setUploading(true)
    const path = `${userId}/logo`

    const { error } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (error) {
      console.error('Logo upload error:', error)
      alert('Failed to upload logo. Please ensure the "logos" storage bucket exists in Supabase.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(path)

    onChange('logo_url', publicUrl)
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Account Profile Section */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Account Profile</h3>
        <p className="text-xs text-grey">Your primary contact information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Full Name</label>
          <input
            type="text"
            value={values.full_name}
            onChange={(e) => onChange('full_name', e.target.value)}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Phone Number</label>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>
      </div>

      <div className="border-t border-grey-light pt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Business Identity</h3>
          <p className="text-xs text-grey">Your workshop branding and contact details</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Company Name</label>
          <input
            type="text"
            value={values.company_name}
            onChange={(e) => onChange('company_name', e.target.value)}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Company Address</label>
          <textarea
            rows={3}
            value={values.address}
            onChange={(e) => onChange('address', e.target.value)}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">WhatsApp Business Number</label>
          <input
            type="tel"
            value={values.whatsapp_number}
            onChange={(e) => onChange('whatsapp_number', e.target.value)}
            placeholder="e.g. 27821234567"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Company Logo</label>
          <div className="flex items-center gap-4">
            {values.logo_url ? (
              <img
                src={values.logo_url}
                alt="Logo preview"
                className="h-16 w-16 object-contain rounded-base border border-grey-light bg-white"
              />
            ) : (
              <div className="h-16 w-16 rounded-base border border-grey-light bg-grey-lightest flex items-center justify-center">
                <ImageIcon size={24} className="text-grey-medium" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <p className="text-[10px] text-grey-medium">Recommended: PNG or JPG, max 2MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
