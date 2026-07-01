'use client'

import { useState } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { Database } from '@/types/database'
import { toast } from 'sonner'
import { sanitizeName, sanitizePhone, sanitizeText } from '@/lib/input-sanitizer'

type Profile = Database['public']['Tables']['profiles']['Row']

interface EditClientFormProps {
  profile: Profile
  onClose: () => void
  onSaved: () => void
}

export function EditClientForm({ profile, onClose, onSaved }: EditClientFormProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
    alternate_phone: profile.alternate_phone ?? '',
    physical_address: profile.physical_address ?? '',
    prefers_whatsapp: profile.prefers_whatsapp ?? true,
    service_reminders_opt_in: profile.service_reminders_opt_in ?? true,
    client_status: profile.client_status ?? 'active',
    internal_notes: profile.internal_notes ?? '',
  })

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/customers/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: sanitizeName(form.full_name) || null,
          phone: sanitizePhone(form.phone) || null,
          alternate_phone: sanitizePhone(form.alternate_phone) || null,
          physical_address: sanitizeText(form.physical_address) || null,
          prefers_whatsapp: form.prefers_whatsapp,
          service_reminders_opt_in: form.service_reminders_opt_in,
          client_status: form.client_status,
          internal_notes: sanitizeText(form.internal_notes) || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update client')

      toast.success('Client updated')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-base shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-grey-medium/20">
          <h2 className="text-lg font-bold text-grey-dark">Edit Client</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-base text-grey hover:bg-grey-lightest transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {/* Contact */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Alternate Phone</label>
              <input
                type="tel"
                value={form.alternate_phone}
                onChange={(e) => handleChange('alternate_phone', e.target.value)}
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Physical Address</label>
            <textarea
              rows={2}
              value={form.physical_address}
              onChange={(e) => handleChange('physical_address', e.target.value)}
              className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
            />
          </div>

          {/* Preferences */}
          <div className="border-t border-grey-light pt-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-grey-dark">Preferences</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-grey-dark">Prefers WhatsApp contact</span>
              <button
                type="button"
                onClick={() => handleChange('prefers_whatsapp', !form.prefers_whatsapp)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  form.prefers_whatsapp ? 'bg-primary' : 'bg-grey-light'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  form.prefers_whatsapp ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-grey-dark">Service reminders</span>
              <button
                type="button"
                onClick={() => handleChange('service_reminders_opt_in', !form.service_reminders_opt_in)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  form.service_reminders_opt_in ? 'bg-primary' : 'bg-grey-light'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  form.service_reminders_opt_in ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* CRM */}
          <div className="border-t border-grey-light pt-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-grey-dark">CRM Status</h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Client Status</label>
              <select
                value={form.client_status}
                onChange={(e) => handleChange('client_status', e.target.value)}
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
              >
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Internal Notes</label>
              <textarea
                rows={4}
                value={form.internal_notes}
                onChange={(e) => handleChange('internal_notes', e.target.value)}
                placeholder="Private notes about this client..."
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-grey-lightest transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-base bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
