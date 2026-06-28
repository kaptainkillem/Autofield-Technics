'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Settings, ArrowLeft, Loader2, Building2, Banknote, FileText, Clock, CalendarX,
  Bell, MessageCircle, Mail, Palette
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SITE_CONFIG } from '@/lib/site-config'
import { BusinessForm } from '@/components/settings/BusinessForm'
import { FinancialForm } from '@/components/settings/FinancialForm'
import { QuoteSettingsForm } from '@/components/settings/QuoteSettingsForm'
import { WorkingHoursForm } from '@/components/settings/WorkingHoursForm'
import { BlockedSlotsForm } from '@/components/settings/BlockedSlotsForm'
import { NotificationsForm } from '@/components/settings/NotificationsForm'
import { WhatsAppForm } from '@/components/settings/WhatsAppForm'
import { EmailForm } from '@/components/settings/EmailForm'
import { BrandingForm } from '@/components/settings/BrandingForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

type Tab =
  | 'business'
  | 'financials'
  | 'quotes'
  | 'working_hours'
  | 'blocked_slots'
  | 'notifications'
  | 'whatsapp'
  | 'email'
  | 'branding'

interface FormData {
  full_name: string
  phone: string
  company_name: string
  logo_url: string
  address: string
  whatsapp_number: string
  vat_number: string
  registration_number: string
  bank_name: string
  account_holder: string
  account_number: string
  branch_code: string
  hourly_rate: string
  callout_fee: string
  diagnostic_fee: string
  default_deposit_percent: string
  terms_conditions: string
}

const defaultFormData: FormData = {
  full_name: '', phone: '', company_name: '', logo_url: '', address: '',
  whatsapp_number: '', vat_number: '', registration_number: '', bank_name: '',
  account_holder: '', account_number: '', branch_code: '', hourly_rate: '',
  callout_fee: '', diagnostic_fee: '', default_deposit_percent: '', terms_conditions: '',
}

interface BusinessSettings {
  notification_email: boolean
  notification_push: boolean
  notification_whatsapp: boolean
  whatsapp_auto_reply: string | null
  whatsapp_business_only: boolean
  email_display_name: string | null
  email_reply_to: string | null
  smtp_note: string | null
  primary_color: string
  accent_color: string
  favicon_url: string | null
}

const defaultBusinessSettings: BusinessSettings = {
  notification_email: true,
  notification_push: true,
  notification_whatsapp: false,
  whatsapp_auto_reply: null,
  whatsapp_business_only: false,
  email_display_name: 'Autofield Technics',
  email_reply_to: 'info@autofieldstechnics.co.za',
  smtp_note: 'SMTP configuration is managed via Environment Variables.',
  primary_color: '#3B82F6',
  accent_color: '#10B981',
  favicon_url: null,
}

const tabs = [
  { id: 'business' as Tab, label: 'Business', icon: Building2 },
  { id: 'financials' as Tab, label: 'Financials', icon: Banknote },
  { id: 'quotes' as Tab, label: 'Quotes', icon: FileText },
  { id: 'notifications' as Tab, label: 'Alerts', icon: Bell },
  { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: MessageCircle },
  { id: 'email' as Tab, label: 'Email', icon: Mail },
  { id: 'branding' as Tab, label: 'Branding', icon: Palette },
  { id: 'working_hours' as Tab, label: 'Hours', icon: Clock },
  { id: 'blocked_slots' as Tab, label: 'Blocked', icon: CalendarX },
]

const profileTabs: Tab[] = ['business', 'financials', 'quotes']
const settingsTabs: Tab[] = ['notifications', 'whatsapp', 'email', 'branding']
const calendarTabs: Tab[] = ['working_hours', 'blocked_slots']

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('business')
  const [userId, setUserId] = useState<string>('')
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [bizSettings, setBizSettings] = useState<BusinessSettings>(defaultBusinessSettings)

  useEffect(() => {
    async function fetchAllData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setUserId(user.id)

      const [profileRes, settingsRes] = await Promise.all([
        (supabase as any).from('profiles').select('*').eq('id', user.id).single(),
        (supabase as any).from('business_settings').select('*').eq('id', 'config').single(),
      ])

      if (profileRes.data) {
        const d = profileRes.data
        setFormData({
          full_name: d.full_name ?? '', phone: d.phone ?? '', company_name: d.company_name ?? '',
          logo_url: d.logo_url ?? '', address: d.address ?? '', whatsapp_number: d.whatsapp_number ?? '',
          vat_number: d.vat_number ?? '', registration_number: d.registration_number ?? '',
          bank_name: d.bank_name ?? '', account_holder: d.account_holder ?? '',
          account_number: d.account_number ?? '', branch_code: d.branch_code ?? '',
          hourly_rate: d.hourly_rate?.toString() ?? '', callout_fee: d.callout_fee?.toString() ?? '',
          diagnostic_fee: d.diagnostic_fee?.toString() ?? '',
          default_deposit_percent: d.default_deposit_percent?.toString() ?? '',
          terms_conditions: d.terms_conditions ?? '',
        })
      } else {
        setFormData((prev) => ({
          ...prev,
          full_name: user.user_metadata?.full_name ?? '',
          phone: user.phone ?? '',
        }))
      }

      if (settingsRes.data) {
        const s = settingsRes.data
        setBizSettings({
          notification_email: s.notification_email ?? true,
          notification_push: s.notification_push ?? true,
          notification_whatsapp: s.notification_whatsapp ?? false,
          whatsapp_auto_reply: s.whatsapp_auto_reply ?? null,
          whatsapp_business_only: s.whatsapp_business_only ?? false,
          email_display_name: s.email_display_name ?? 'Autofield Technics',
          email_reply_to: s.email_reply_to ?? 'info@autofieldstechnics.co.za',
          smtp_note: s.smtp_note ?? 'SMTP configuration is managed via Environment Variables.',
          primary_color: s.primary_color ?? '#3B82F6',
          accent_color: s.accent_color ?? '#10B981',
          favicon_url: s.favicon_url ?? null,
        })
      }

      setLoading(false)
    }
    fetchAllData()
  }, [router])

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      id: user.id,
      full_name: formData.full_name.trim() || null,
      phone: formData.phone.trim() || null,
      company_name: formData.company_name.trim() || null,
      logo_url: formData.logo_url.trim() || null,
      address: formData.address.trim() || null,
      whatsapp_number: formData.whatsapp_number.trim() || null,
      vat_number: formData.vat_number.trim() || null,
      registration_number: formData.registration_number.trim() || null,
      bank_name: formData.bank_name.trim() || null,
      account_holder: formData.account_holder.trim() || null,
      account_number: formData.account_number.trim() || null,
      branch_code: formData.branch_code.trim() || null,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      callout_fee: formData.callout_fee ? parseFloat(formData.callout_fee) : null,
      diagnostic_fee: formData.diagnostic_fee ? parseFloat(formData.diagnostic_fee) : null,
      default_deposit_percent: formData.default_deposit_percent ? parseFloat(formData.default_deposit_percent) : null,
      terms_conditions: formData.terms_conditions.trim() || null,
    }

    const { error } = await (supabase as any).from('profiles').upsert(payload)
    setSaving(false)

    if (error) {
      console.error('Save error:', error)
      toast.error('Failed to save settings')
      return
    }

    toast.success('Settings updated successfully!')
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Settings className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <PageWrapper className="max-w-[900px] gap-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">{SITE_CONFIG.dashboard.pageTitles.settings}</h1>
          <p className="text-xs text-grey">Manage your business identity, financials, communications, and availability.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-grey-medium/10 rounded-base p-1 shadow-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-base text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-grey hover:bg-primary/5 hover:text-grey-dark'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Profile-based tabs with shared save */}
      {profileTabs.includes(activeTab) ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
            {activeTab === 'business' && (
              <BusinessForm values={formData} onChange={handleChange} userId={userId} />
            )}
            {activeTab === 'financials' && (
              <FinancialForm values={formData} onChange={handleChange} />
            )}
            {activeTab === 'quotes' && (
              <QuoteSettingsForm values={formData} onChange={handleChange} />
            )}
          </div>

          <div className="sticky bottom-4 mt-6 bg-white border border-grey-medium/10 rounded-base p-4 shadow-lg flex items-center justify-between z-10">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-grey-dark">Unsaved changes?</span>
              <span className="text-xs text-grey">Make sure to save your updates</span>
            </div>
            <Button
              type="submit"
              disabled={saving}
              aria-disabled={saving}
              aria-busy={saving}
              className="bg-primary text-white font-bold py-2.5 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      ) : settingsTabs.includes(activeTab) ? (
        <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
          {activeTab === 'notifications' && (
            <NotificationsForm
              settings={bizSettings}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
          {activeTab === 'whatsapp' && (
            <WhatsAppForm
              settings={bizSettings}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
          {activeTab === 'email' && (
            <EmailForm
              settings={bizSettings}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
          {activeTab === 'branding' && (
            <BrandingForm
              settings={bizSettings}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
        </div>
      ) : (
        <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
          {activeTab === 'working_hours' && <WorkingHoursForm />}
          {activeTab === 'blocked_slots' && <BlockedSlotsForm />}
        </div>
      )}
    </PageWrapper>
  )
}
