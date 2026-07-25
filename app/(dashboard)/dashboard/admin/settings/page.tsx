'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase, getWorkshopIdFromSession } from '@/lib/supabase'
import { saveAdminSettings } from '@/lib/settings-api'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Settings, ArrowLeft, Loader2, Building2, Banknote, FileText, Clock, CalendarX, Scale,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BusinessForm } from '@/components/settings/BusinessForm'
import { FinancialForm } from '@/components/settings/FinancialForm'
import { QuoteSettingsForm } from '@/components/settings/QuoteSettingsForm'
import { WorkingHoursForm } from '@/components/settings/WorkingHoursForm'
import { BlockedSlotsForm } from '@/components/settings/BlockedSlotsForm'
import { LegalSettingsForm } from '@/components/settings/LegalSettingsForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

type Tab =
  | 'business'
  | 'financials'
  | 'quotes'
  | 'legal'
  | 'working_hours'
  | 'blocked_slots'

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

const tabs = [
  { id: 'business' as Tab, label: 'Business', icon: Building2 },
  { id: 'financials' as Tab, label: 'Financials', icon: Banknote },
  { id: 'quotes' as Tab, label: 'Quotes', icon: FileText },
  { id: 'legal' as Tab, label: 'Legal & PDFs', icon: Scale },
  { id: 'working_hours' as Tab, label: 'Hours', icon: Clock },
  { id: 'blocked_slots' as Tab, label: 'Blocked', icon: CalendarX },
]

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Settings className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>(tabParam && tabs.some(t => t.id === tabParam) ? tabParam : 'business')
  const [userId, setUserId] = useState<string>('')
  const [workshopId, setWorkshopId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
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
        (supabase as any).from('public_business_settings').select('*').eq('workshop_id', workshopsId).single(),
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
        setDocumentFooter(s?.document_footer ?? '')
      } else {
        setFormData((prev) => ({
          ...prev,
          full_name: user.user_metadata?.full_name ?? '',
          phone: user.phone ?? '',
        }))
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

    const bizPayload: Record<string, unknown> = {
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

    try {
      await Promise.all([
        (supabase as any).from('profiles').upsert(profilePayload),
        saveAdminSettings(bizPayload),
      ])
      toast.success('Settings updated successfully!')
    } catch (err: any) {
      console.error('Save error:', err)
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">Workspace Settings</h1>
          <p className="text-xs text-grey">Manage your business details, financials, schedule, and availability.</p>
        </div>
      </div>

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

      {activeTab === 'working_hours' || activeTab === 'blocked_slots' ? (
        <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
          {activeTab === 'working_hours' && <WorkingHoursForm />}
          {activeTab === 'blocked_slots' && <BlockedSlotsForm />}
        </div>
      ) : (
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
                useAdminApi
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
      )}
    </PageWrapper>
  )
}
