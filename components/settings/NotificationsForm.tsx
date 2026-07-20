'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Bell, Mail, MessageCircle, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationSettings {
  notification_email: boolean
  notification_push: boolean
  notification_whatsapp: boolean
}

interface NotificationsFormProps {
  settings: NotificationSettings
  workshopId: string | null
  onUpdate: (settings: NotificationSettings) => void
}

export function NotificationsForm({ settings, workshopId, onUpdate }: NotificationsFormProps) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)

  function toggle(field: keyof NotificationSettings) {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await (supabase as any)
      .from('business_settings')
      .upsert({
        workshop_id: workshopId,
        notification_email: form.notification_email,
        notification_push: form.notification_push,
        notification_whatsapp: form.notification_whatsapp,
        updated_at: new Date().toISOString(),
      })

    setSaving(false)

    if (error) {
      console.error('Save notifications error:', error)
      toast.error('Failed to save notification settings')
      return
    }

    onUpdate(form)
    toast.success('Notification preferences saved!')
  }

  const channels = [
    {
      key: 'notification_email' as const,
      label: 'Email Notifications',
      description: 'Receive updates about new quotes, appointments, and reviews via email.',
      icon: Mail,
    },
    {
      key: 'notification_push' as const,
      label: 'In-App Notifications',
      description: 'Show bell icon alerts inside the dashboard when new activity occurs.',
      icon: Bell,
    },
    {
      key: 'notification_whatsapp' as const,
      label: 'WhatsApp Notifications',
      description: 'Get urgent alerts forwarded to your WhatsApp Business number.',
      icon: MessageCircle,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">Notification Preferences</h3>
          <p className="text-xs text-grey">Choose how you want to be alerted about shop activity.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          aria-disabled={saving}
          aria-busy={saving}
          className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {channels.map((channel) => {
          const Icon = channel.icon
          const isActive = form[channel.key]
          return (
            <div
              key={channel.key}
              className={`flex items-center justify-between p-4 rounded-base border transition-all ${
                isActive
                  ? 'bg-white border-grey-medium/10'
                  : 'bg-grey-light/30 border-grey-light/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-base flex items-center justify-center ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-grey-light text-grey-medium'
                }`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isActive ? 'text-grey-dark' : 'text-grey-medium'}`}>
                    {channel.label}
                  </p>
                  <p className="text-xs text-grey">{channel.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggle(channel.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-grey-light peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-grey-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
