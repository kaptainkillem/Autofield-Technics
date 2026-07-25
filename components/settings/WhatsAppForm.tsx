'use client'

import { useState } from 'react'
import { saveSuperAdminSettings } from '@/lib/settings-api'
import { sanitizeText } from '@/lib/input-sanitizer'
import { toast } from 'sonner'
import { MessageCircle, Clock, Save, Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WhatsAppSettings {
  whatsapp_auto_reply: string | null
  whatsapp_business_only: boolean
}

interface WhatsAppFormProps {
  settings: WhatsAppSettings
  workshopId: string | null
  onUpdate: (settings: WhatsAppSettings) => void
}

const DEFAULT_AUTO_REPLY = `👋 Hi there! Thanks for messaging Autofield Technics.\n\nWe're currently busy in the workshop, but we'll get back to you as soon as possible.\n\nFor urgent repairs, please call us directly.\n\n— Prince, Lead Mechanic`

export function WhatsAppForm({ settings, workshopId, onUpdate }: WhatsAppFormProps) {
  const [form, setForm] = useState<WhatsAppSettings>({
    whatsapp_auto_reply: settings.whatsapp_auto_reply ?? DEFAULT_AUTO_REPLY,
    whatsapp_business_only: settings.whatsapp_business_only ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  async function handleSave() {
    if (!workshopId) return
    setSaving(true)
    try {
      await saveSuperAdminSettings(workshopId, {
        whatsapp_auto_reply: form.whatsapp_auto_reply ? sanitizeText(form.whatsapp_auto_reply) : null,
        whatsapp_business_only: form.whatsapp_business_only,
      })
      onUpdate(form)
      toast.success('WhatsApp settings saved!')
    } catch (err: any) {
      console.error('Save WhatsApp error:', err)
      toast.error(err.message || 'Failed to save WhatsApp settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">WhatsApp Settings</h3>
          <p className="text-xs text-grey">Configure auto-reply and business-hours behavior.</p>
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

      {/* Business Hours Only Toggle */}
      <div className="flex items-center justify-between p-4 rounded-base border border-grey-medium/10 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-base bg-primary/10 text-primary flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-grey-dark">Business Hours Only</p>
            <p className="text-xs text-grey">Only send auto-replies outside working hours.</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.whatsapp_business_only}
            onChange={(e) => setForm((prev) => ({ ...prev, whatsapp_business_only: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-grey-light peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-grey-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
        </label>
      </div>

      {/* Auto-Reply Message */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <MessageCircle size={12} />
            Auto-Reply Message
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
          >
            <Eye size={12} />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        <textarea
          value={form.whatsapp_auto_reply ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, whatsapp_auto_reply: e.target.value }))}
          placeholder="Enter your auto-reply message..."
          rows={6}
          className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono"
        />
        <p className="text-[10px] text-grey-medium">This message will be sent automatically when customers message your WhatsApp Business number.</p>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-green-50 border border-green-200 rounded-base p-4 flex flex-col gap-2">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Preview</p>
          <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-sm">
            <p className="text-sm text-grey-dark whitespace-pre-wrap">{form.whatsapp_auto_reply}</p>
          </div>
        </div>
      )}
    </div>
  )
}
