'use client'

import { useEffect, useState } from 'react'
import { supabase, getWorkshopIdFromSession } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Settings, ArrowLeft, Loader2, Building2, Banknote, FileText, Clock, CalendarX,
  Bell, MessageCircle, Mail, Palette, Type, Scale, 
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
import { WebsiteCopyForm } from '@/components/settings/WebsiteCopyForm'
import { LegalSettingsForm } from '@/components/settings/LegalSettingsForm'
import { EmailTemplatesForm } from '@/components/settings/EmailTemplatesForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

type Tab =
  | 'business'
  | 'financials'
  | 'quotes'
  | 'legal'
  | 'working_hours'
  | 'blocked_slots'
  | 'notifications'
  | 'whatsapp'
  | 'email'
  | 'branding'
  | 'website_copy'
  | 'email_templates'

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
  document_footer: string | null
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
  document_footer: null,
}

const tabs = [
  { id: 'business' as Tab, label: 'Business', icon: Building2 },
  { id: 'financials' as Tab, label: 'Financials', icon: Banknote },
  { id: 'quotes' as Tab, label: 'Quotes', icon: FileText },
  { id: 'legal' as Tab, label: 'Legal & PDFs', icon: Scale },
  { id: 'website_copy' as Tab, label: 'Content', icon: Type },
  { id: 'notifications' as Tab, label: 'Alerts', icon: Bell },
  { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: MessageCircle },
  { id: 'email' as Tab, label: 'Email', icon: Mail },
  { id: 'branding' as Tab, label: 'Branding', icon: Palette },
  { id: 'working_hours' as Tab, label: 'Hours', icon: Clock },
  { id: 'blocked_slots' as Tab, label: 'Blocked', icon: CalendarX },
  { id: 'email_templates' as Tab, label: 'Templates', icon: Mail },
]

const profileTabs: Tab[] = ['business', 'financials', 'quotes', 'legal']
const contentTabs: Tab[] = ['website_copy']
const settingsTabs: Tab[] = ['notifications', 'whatsapp', 'email', 'branding', 'email_templates']
const calendarTabs: Tab[] = ['working_hours', 'blocked_slots']

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('business')
  const [userId, setUserId] = useState<string>('')
  const [workshopId, setWorkshopId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [bizSettings, setBizSettings] = useState<BusinessSettings>(defaultBusinessSettings)
  const [websiteCopy, setWebsiteCopy] = useState({
    site_name: '',
    phone: '',
    city: '',
    hero_title: '',
    hero_description: '',
    contact_email: '',
  })
  const [documentFooter, setDocumentFooter] = useState('')

  useEffect(() => {
    async function fetchAllData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setUserId(user.id)

      const { data: { session } } = await supabase.auth.getSession()
      const workshopsId = getWorkshopIdFromSession(session)
      setWorkshopId(workshopsId)

      const [profileRes, settingsRes] = await Promise.all([
        (supabase as any).from('profiles').select('*').eq('id', user.id).single(),
        (supabase as any).from('business_settings').select('*').eq('workshop_id', workshopsId).single(),
      ])

      if (profileRes.data) {
        const d = profileRes.data
        const s = settingsRes.data
        setFormData({
          full_name: d.full_name ?? '', phone: d.phone ?? '',
          company_name: s?.company_name ?? '',
          logo_url: s?.logo_url ?? '', address: s?.address ?? '',
          whatsapp_number: d.whatsapp_number ?? '',
          vat_number: s?.vat_number ?? '',
          registration_number: s?.registration_number ?? '',
          bank_name: s?.bank_name ?? '',
          account_holder: s?.account_holder ?? '',
          account_number: s?.account_number ?? '',
          branch_code: s?.branch_code ?? '',
          hourly_rate: s?.hourly_rate?.toString() ?? '',
          callout_fee: s?.callout_fee?.toString() ?? '',
          diagnostic_fee: s?.diagnostic_fee?.toString() ?? '',
          default_deposit_percent: s?.default_deposit_percent?.toString() ?? '',
          terms_conditions: s?.terms_conditions ?? '',
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
          document_footer: s.document_footer ?? null,
        })
        setWebsiteCopy({
          site_name: s.site_name ?? 'Autofields Technics',
          phone: s.phone ?? '+27784802796',
          city: s.city ?? 'Johannesburg',
          hero_title: s.hero_title ?? 'Professional Mechanical Care, Wherever You Are',
          hero_description: s.hero_description ?? 'From emergency roadside assistance to expert workshop repairs in {city}.',
          contact_email: s.contact_email ?? 'info@autofieldstechnics.co.za',
        })
        setDocumentFooter(s.document_footer ?? '')
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

    const profilePayload = {
      id: user.id,
      full_name: formData.full_name.trim() || null,
      phone: formData.phone.trim() || null,
      whatsapp_number: formData.whatsapp_number.trim() || null,
    }

    const bizPayload = {
      workshop_id: workshopId,
      company_name: formData.company_name.trim() || null,
      logo_url: formData.logo_url.trim() || null,
      address: formData.address.trim() || null,
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

    const [profileRes, bizRes] = await Promise.all([
      (supabase as any).from('profiles').upsert(profilePayload),
      (supabase as any).from('business_settings').upsert(bizPayload),
    ])

    setSaving(false)

    if (profileRes.error || bizRes.error) {
      console.error('Save error:', profileRes.error || bizRes.error)
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
            {activeTab === 'legal' && (
              <LegalSettingsForm
                termsConditions={formData.terms_conditions}
                documentFooter={documentFooter}
                workshopId={workshopId}
                onTermsChange={(v) => handleChange('terms_conditions', v)}
                onDocumentFooterChange={setDocumentFooter}
              />
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
      ) : contentTabs.includes(activeTab) ? (
        <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
          {activeTab === 'website_copy' && (
            <WebsiteCopyForm
              initialData={websiteCopy}
              workshopId={workshopId}
              onSaved={() => {
                // Refresh data after save
                window.location.reload()
              }}
            />
          )}
        </div>
      ) : settingsTabs.includes(activeTab) ? (
        <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
          {activeTab === 'notifications' && (
            <NotificationsForm
              settings={bizSettings}
              workshopId={workshopId}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
          {activeTab === 'whatsapp' && (
            <WhatsAppForm
              settings={bizSettings}
              workshopId={workshopId}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
          {activeTab === 'email' && (
            <EmailForm
              settings={bizSettings}
              workshopId={workshopId}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
          {activeTab === 'branding' && (
            <BrandingForm
              settings={bizSettings}
              workshopId={workshopId}
              onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
            />
          )}
          {activeTab === 'email_templates' && (
            <EmailTemplatesForm workshopId={workshopId} />
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
