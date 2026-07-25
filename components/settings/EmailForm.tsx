'use client'

import { useState } from 'react'
import { saveSuperAdminSettings } from '@/lib/settings-api'
import { toast } from 'sonner'
import { Mail, Save, Loader2, Server, Eye, EyeOff, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmailSettings {
  email_display_name: string | null
  email_reply_to: string | null
  smtp_note: string | null
  email_provider: string | null
  email_from: string | null
  admin_notification_email: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_username: string | null
  smtp_password: string | null
  smtp_secure: boolean | null
}

interface EmailFormProps {
  settings: EmailSettings
  workshopId: string | null
  onUpdate: (settings: EmailSettings) => void
}

export function EmailForm({ settings, workshopId, onUpdate }: EmailFormProps) {
  const [form, setForm] = useState<EmailSettings>({
    email_display_name: settings.email_display_name ?? 'Autofield Technics',
    email_reply_to: settings.email_reply_to ?? 'info@autofieldstechnics.co.za',
    smtp_note: settings.smtp_note ?? null,
    email_provider: settings.email_provider ?? 'resend',
    email_from: settings.email_from ?? null,
    admin_notification_email: settings.admin_notification_email ?? null,
    smtp_host: settings.smtp_host ?? null,
    smtp_port: settings.smtp_port ?? 587,
    smtp_username: settings.smtp_username ?? null,
    smtp_password: settings.smtp_password ?? null,
    smtp_secure: settings.smtp_secure ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSave() {
    if (!workshopId) return
    setSaving(true)
    try {
      await saveSuperAdminSettings(workshopId, {
        email_display_name: form.email_display_name?.trim() || null,
        email_reply_to: form.email_reply_to?.trim() || null,
        email_provider: form.email_provider || 'resend',
        email_from: form.email_from?.trim() || null,
        admin_notification_email: form.admin_notification_email?.trim() || null,
        smtp_host: form.smtp_host?.trim() || null,
        smtp_port: form.smtp_port ?? null,
        smtp_username: form.smtp_username?.trim() || null,
        smtp_password: form.smtp_password ?? null,
        smtp_secure: form.smtp_secure ?? true,
      })
      onUpdate(form)
      toast.success('Email settings saved!')
    } catch (err: any) {
      console.error('Save email error:', err)
      toast.error(err.message || 'Failed to save email settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">Email Settings</h3>
          <p className="text-xs text-grey">Configure how emails are sent from this workshop.</p>
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
        {/* Provider Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <Server size={12} />
            Email Provider
          </label>
          <select
            value={form.email_provider ?? 'resend'}
            onChange={(e) => setForm((prev) => ({ ...prev, email_provider: e.target.value }))}
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
          >
            <option value="resend">Resend (API Key from env)</option>
            <option value="smtp">SMTP (Custom Server)</option>
          </select>
          {form.email_provider === 'resend' && (
            <p className="text-[10px] text-grey-medium mt-1">
              Uses the RESEND_API_KEY configured in environment variables. Domains must be verified in your Resend dashboard.
            </p>
          )}
        </div>

        {/* From Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <Mail size={12} />
            From Email Address
          </label>
          <input
            type="email"
            value={form.email_from ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, email_from: e.target.value }))}
            placeholder="e.g. noreply@yourworkshop.co.za"
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-[10px] text-grey-medium">Full email address including display name: &quot;Workshop Name &lt;noreply@yourdomain.co.za&gt;&quot;.</p>
        </div>

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
            placeholder="e.g. info@yourworkshop.co.za"
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Admin Notification Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <Shield size={12} />
            Admin Notification Inbox
          </label>
          <input
            type="email"
            value={form.admin_notification_email ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, admin_notification_email: e.target.value }))}
            placeholder="e.g. owner@yourworkshop.co.za"
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-[10px] text-grey-medium">Receives new quote alerts, contact form submissions, and webhook notifications.</p>
        </div>

        {/* SMTP Fields (only when provider is SMTP) */}
        {form.email_provider === 'smtp' && (
          <div className="flex flex-col gap-4 border-t border-grey-light pt-4 mt-2">
            <p className="text-xs font-bold text-grey-dark uppercase tracking-wide">SMTP Server Configuration</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-grey uppercase">SMTP Host</label>
                <input
                  type="text"
                  value={form.smtp_host ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, smtp_host: e.target.value }))}
                  placeholder="e.g. smtp.gmail.com"
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-grey uppercase">Port</label>
                <input
                  type="number"
                  value={form.smtp_port ?? 587}
                  onChange={(e) => setForm((prev) => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smtp-secure"
                checked={form.smtp_secure ?? true}
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_secure: e.target.checked }))}
                className="rounded border-grey-medium/20 text-primary focus:ring-primary"
              />
              <label htmlFor="smtp-secure" className="text-xs text-grey cursor-pointer">
                Use SSL/TLS (secure connection)
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey uppercase">Username</label>
              <input
                type="text"
                value={form.smtp_username ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_username: e.target.value }))}
                placeholder="e.g. your@email.com"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.smtp_password ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, smtp_password: e.target.value }))}
                  placeholder="SMTP password or app password"
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 pl-3 pr-10 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-grey-medium hover:text-grey-dark transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
