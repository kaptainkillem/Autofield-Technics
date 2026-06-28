'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Settings, ArrowLeft, Loader2, Building2, Banknote, FileText, Clock, CalendarX } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BusinessForm } from '@/components/settings/BusinessForm'
import { FinancialForm } from '@/components/settings/FinancialForm'
import { QuoteSettingsForm } from '@/components/settings/QuoteSettingsForm'
import { WorkingHoursForm } from '@/components/settings/WorkingHoursForm'
import { BlockedSlotsForm } from '@/components/settings/BlockedSlotsForm'

type Tab = 'business' | 'financials' | 'quotes' | 'working_hours' | 'blocked_slots'

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
  full_name: '',
  phone: '',
  company_name: '',
  logo_url: '',
  address: '',
  whatsapp_number: '',
  vat_number: '',
  registration_number: '',
  bank_name: '',
  account_holder: '',
  account_number: '',
  branch_code: '',
  hourly_rate: '',
  callout_fee: '',
  diagnostic_fee: '',
  default_deposit_percent: '',
  terms_conditions: '',
}

const tabs = [
  { id: 'business' as Tab, label: 'Business Identity', icon: Building2 },
  { id: 'financials' as Tab, label: 'Financials', icon: Banknote },
  { id: 'quotes' as Tab, label: 'Quote Settings', icon: FileText },
  { id: 'working_hours' as Tab, label: 'Working Hours', icon: Clock },
  { id: 'blocked_slots' as Tab, label: 'Blocked Slots', icon: CalendarX },
]

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('business')
  const [userId, setUserId] = useState<string>('')
  const [formData, setFormData] = useState<FormData>(defaultFormData)

  useEffect(() => {
    async function fetchProfileData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setUserId(user.id)

      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFormData({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          company_name: data.company_name ?? '',
          logo_url: data.logo_url ?? '',
          address: data.address ?? '',
          whatsapp_number: data.whatsapp_number ?? '',
          vat_number: data.vat_number ?? '',
          registration_number: data.registration_number ?? '',
          bank_name: data.bank_name ?? '',
          account_holder: data.account_holder ?? '',
          account_number: data.account_number ?? '',
          branch_code: data.branch_code ?? '',
          hourly_rate: data.hourly_rate?.toString() ?? '',
          callout_fee: data.callout_fee?.toString() ?? '',
          diagnostic_fee: data.diagnostic_fee?.toString() ?? '',
          default_deposit_percent: data.default_deposit_percent?.toString() ?? '',
          terms_conditions: data.terms_conditions ?? '',
        })
      } else {
        setFormData((prev) => ({
          ...prev,
          full_name: user.user_metadata?.full_name ?? '',
          phone: user.phone ?? '',
        }))
      }
      setLoading(false)
    }
    fetchProfileData()
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

    const { error } = await (supabase as any)
      .from('profiles')
      .upsert(payload)

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
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[800px] mx-auto w-full mt-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">Workspace Settings</h1>
          <p className="text-xs text-grey">Manage your business identity, financials, quote defaults, and availability.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white border border-grey-medium/10 rounded-base p-1.5 shadow-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-base text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-grey hover:bg-primary/5 hover:text-grey-dark'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {['business', 'financials', 'quotes'].includes(activeTab) ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
            {activeTab === 'business' && (
              <BusinessForm
                values={formData}
                onChange={handleChange}
                userId={userId}
              />
            )}
            {activeTab === 'financials' && (
              <FinancialForm
                values={formData}
                onChange={handleChange}
              />
            )}
            {activeTab === 'quotes' && (
              <QuoteSettingsForm
                values={formData}
                onChange={handleChange}
              />
            )}
          </div>

          {/* Sticky Save Button */}
          <div className="sticky bottom-4 mt-6 bg-white border border-grey-medium/10 rounded-base p-4 shadow-lg flex items-center justify-between z-10">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-grey-dark">Unsaved changes?</span>
              <span className="text-xs text-grey">Make sure to save your updates</span>
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-white font-bold py-2.5 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
          {activeTab === 'working_hours' && <WorkingHoursForm />}
          {activeTab === 'blocked_slots' && <BlockedSlotsForm />}
        </div>
      )}
    </div>
  )
}
