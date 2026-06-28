'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, MessageCircle, Mail, Megaphone } from 'lucide-react'

interface NotificationSettings {
  notification_quotes_whatsapp: boolean
  notification_appointments_email: boolean
  notification_marketing: boolean
}

interface ClientNotificationsFormProps {
  userId: string
  initialData: NotificationSettings
  onSaved?: () => void
}

export function ClientNotificationsForm({ userId, initialData, onSaved }: ClientNotificationsFormProps) {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    notification_quotes_whatsapp: initialData.notification_quotes_whatsapp ?? true,
    notification_appointments_email: initialData.notification_appointments_email ?? true,
    notification_marketing: initialData.notification_marketing ?? false,
  })

  async function handleToggle(field: keyof NotificationSettings) {
    const next = { ...settings, [field]: !settings[field] }
    setSettings(next)

    setSaving(true)
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ [field]: next[field] })
      .eq('id', userId)
    setSaving(false)

    if (error) {
      console.error('Notification update error:', error)
      toast.error('Failed to update preference. Please try again.')
      setSettings(settings) // rollback
      return
    }

    toast.success('Preference updated')
    onSaved?.()
  }

  const toggles = [
    {
      key: 'notification_quotes_whatsapp' as const,
      label: 'Quote Updates via WhatsApp',
      description: 'Receive WhatsApp messages when your quote status changes.',
      icon: MessageCircle,
    },
    {
      key: 'notification_appointments_email' as const,
      label: 'Email Appointment Reminders',
      description: 'Get email reminders before your scheduled appointments.',
      icon: Mail,
    },
    {
      key: 'notification_marketing' as const,
      label: 'Marketing & Promotions',
      description: 'Receive special offers, seasonal deals, and service updates.',
      icon: Megaphone,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-grey-dark">Notification Preferences</h3>
        <p className="text-xs text-grey">
          Control how we contact you. You can change these at any time.
        </p>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-grey">
          <Loader2 size={14} className="animate-spin" />
          Saving...
        </div>
      )}

      <div className="flex flex-col gap-4">
        {toggles.map((toggle) => {
          const Icon = toggle.icon
          const enabled = settings[toggle.key]

          return (
            <div
              key={toggle.key}
              className="flex items-start justify-between gap-4 bg-white border border-grey-medium/10 rounded-base p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-base shrink-0 ${enabled ? 'bg-primary/10 text-primary' : 'bg-grey-light text-grey-medium'}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-grey-dark">{toggle.label}</p>
                  <p className="text-xs text-grey mt-0.5">{toggle.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(toggle.key)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 ${
                  enabled ? 'bg-primary' : 'bg-grey-medium'
                }`}
                role="switch"
                aria-checked={enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-grey-medium">
        These preferences help us stay compliant with POPIA. We will never share your contact details with third parties.
      </p>
    </div>
  )
}
