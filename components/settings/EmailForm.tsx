'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Mail, Save, Loader2, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmailSettings {
  email_display_name: string | null
  email_reply_to: string | null
  smtp_note: string | null
}

interface EmailFormProps {
  settings: EmailSettings
  onUpdate: (settings: EmailSettings) => void
}

export function EmailForm({ settings, onUpdate }: EmailFormProps) {
  const [form, setForm] = useState<EmailSettings>({
    email_display_name: settings.email_display_name ?? 'Autofield Technics',
    email_reply_to: settings.email_reply_to ?? 'info@autofieldstechnics.co.za',
    smtp_note: settings.smtp_note ?? 'SMTP configuration is managed via Environment Variables.',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await (supabase as any)
      .from('business_settings')
      .update({
        email_display_name: form.email_display_name?.trim() || null,
        email_reply_to: form.email_reply_to?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'config')

    setSaving(false)

    if (error) {
      console.error('Save email error:', error)
      toast.error('Failed to save email settings')
      return
    }

    onUpdate(form)
    toast.success('Email settings saved!')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">Email Settings</h3>
          <p className="text-xs text-grey">Configure how your business appears in customer emails.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          aria-disabled={saving}
          aria-busy={saving}
          className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Display Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <Mail size={12} />
            Display Name
          </label>
          <input
            type="text"
            value={form.email_display_name ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, email_display_name: e.target.value }))}
            placeholder="e.g. Autofield Technics"
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-[10px] text-grey-medium">This name will appear as the sender in emails to customers.</p>
        </div>

        {/* Reply-To */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <Mail size={12} />
            Reply-To Email
          </label>
          <input
            type="email"
            value={form.email_reply_to ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, email_reply_to: e.target.value }))}
            placeholder="e.g. info@autofieldstechnics.co.za"
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-[10px] text-grey-medium">Customer replies will be directed to this address.</p>
        </div>
      </div>

      {/* SMTP Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-base p-4 flex items-start gap-3">
        <Server size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">SMTP Configuration</p>
          <p className="text-xs text-amber-700 mt-1">{form.smtp_note}</p>
          <p className="text-xs text-amber-600 mt-2">Contact your developer to update SMTP host, port, username, and password.</p>
        </div>
      </div>
    </div>
  )
}
