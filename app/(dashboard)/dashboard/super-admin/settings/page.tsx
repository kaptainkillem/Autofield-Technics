'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Building2, Bell, MessageCircle, Mail, Palette, Type, Scale, ArrowLeft, ChevronDown, Layout } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { NotificationsForm } from '@/components/settings/NotificationsForm'
import { WhatsAppForm } from '@/components/settings/WhatsAppForm'
import { EmailForm } from '@/components/settings/EmailForm'
import { BrandingForm } from '@/components/settings/BrandingForm'
import { WebsiteCopyForm } from '@/components/settings/WebsiteCopyForm'
import { HomepageContentForm } from '@/components/settings/HomepageContentForm'
import { HomePageContent } from '@/lib/homepage-content'
import { LegalSettingsForm } from '@/components/settings/LegalSettingsForm'
import { EmailTemplatesForm } from '@/components/settings/EmailTemplatesForm'

interface Workshop {
  id: string
  name: string
  slug: string
}

type Tab = 'notifications' | 'whatsapp' | 'email' | 'branding' | 'website_copy' | 'homepage_content' | 'legal' | 'email_templates'

interface BusinessSettings {
  notification_email: boolean
  notification_push: boolean
  notification_whatsapp: boolean
  whatsapp_auto_reply: string | null
  whatsapp_business_only: boolean
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
  primary_color: string
  accent_color: string
  primary_text_color: string | null
  secondary_text_color: string | null
  favicon_url: string | null
  font_family: string | null
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
  smtp_note: null,
  email_provider: 'resend',
  email_from: null,
  admin_notification_email: null,
  smtp_host: null,
  smtp_port: 587,
  smtp_username: null,
  smtp_password: null,
  smtp_secure: true,
  primary_color: '#3B82F6',
  accent_color: '#10B981',
  primary_text_color: '#111827',
  secondary_text_color: '#595959',
  favicon_url: null,
  font_family: 'Inter',
  document_footer: null,
}

const tabs = [
  { id: 'notifications' as Tab, label: 'Alerts', icon: Bell },
  { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: MessageCircle },
  { id: 'email' as Tab, label: 'Email', icon: Mail },
  { id: 'branding' as Tab, label: 'Branding', icon: Palette },
  { id: 'website_copy' as Tab, label: 'Content', icon: Type },
  { id: 'homepage_content' as Tab, label: 'Homepage', icon: Layout },
  { id: 'legal' as Tab, label: 'Legal & PDFs', icon: Scale },
  { id: 'email_templates' as Tab, label: 'Templates', icon: Mail },
]

export default function SuperAdminSettingsPage() {
  return (
    <Suspense fallback={
      <PageWrapper>
        <div className="flex min-h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    }>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const initialWorkshopId = searchParams.get('workshopId')

  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(initialWorkshopId)
  const [loadingWorkshops, setLoadingWorkshops] = useState(true)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [bizSettings, setBizSettings] = useState<BusinessSettings>(defaultBusinessSettings)
  const [websiteCopy, setWebsiteCopy] = useState({
    site_name: '',
    phone: '',
    city: '',
    hero_title: '',
    hero_description: '',
    contact_email: '',
  })
  const [homePageContent, setHomePageContent] = useState<HomePageContent | null>(null)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [documentFooter, setDocumentFooter] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('notifications')

  useEffect(() => {
    async function fetchWorkshops() {
      try {
        const res = await fetch('/api/admin/workshops')
        if (!res.ok) throw new Error('Failed')
        const { workshops: data } = await res.json()
        setWorkshops(data ?? [])
      } catch {
        toast.error('Failed to load workshops')
      } finally {
        setLoadingWorkshops(false)
      }
    }
    fetchWorkshops()
  }, [])

  const loadWorkshopSettings = useCallback(async (workshopId: string) => {
    setLoadingSettings(true)
    try {
      const res = await fetch(`/api/admin/super-admin/workshop-settings?workshopId=${workshopId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      if (data.settings) {
        const s = data.settings
        setBizSettings({
          notification_email: s.notification_email ?? true,
          notification_push: s.notification_push ?? true,
          notification_whatsapp: s.notification_whatsapp ?? false,
          whatsapp_auto_reply: s.whatsapp_auto_reply ?? null,
          whatsapp_business_only: s.whatsapp_business_only ?? false,
          email_display_name: s.email_display_name ?? 'Autofield Technics',
          email_reply_to: s.email_reply_to ?? 'info@autofieldstechnics.co.za',
          smtp_note: s.smtp_note ?? null,
          email_provider: s.email_provider ?? 'resend',
          email_from: s.email_from ?? null,
          admin_notification_email: s.admin_notification_email ?? null,
          smtp_host: s.smtp_host ?? null,
          smtp_port: s.smtp_port ?? 587,
          smtp_username: s.smtp_username ?? null,
          smtp_password: s.smtp_password ?? null,
          smtp_secure: s.smtp_secure ?? true,
          primary_color: s.primary_color ?? '#3B82F6',
          accent_color: s.accent_color ?? '#10B981',
          primary_text_color: s.primary_text_color ?? '#111827',
          secondary_text_color: s.secondary_text_color ?? '#595959',
          favicon_url: s.favicon_url ?? null,
          font_family: s.font_family ?? 'Inter',
          document_footer: s.document_footer ?? null,
        })
        setWebsiteCopy({
          site_name: s.site_name ?? 'Autofields Technics',
          phone: s.phone ?? '',
          city: s.city ?? '',
          hero_title: s.hero_title ?? '',
          hero_description: s.hero_description ?? '',
          contact_email: s.contact_email ?? '',
        })
        setHomePageContent(s.home_page_content ?? null)
        setHeroImageUrl(s.hero_image_url ?? null)
        setDocumentFooter(s.document_footer ?? '')
      } else {
        setBizSettings(defaultBusinessSettings)
        setWebsiteCopy({ site_name: '', phone: '', city: '', hero_title: '', hero_description: '', contact_email: '' })
        setHomePageContent(null)
        setHeroImageUrl(null)
        setDocumentFooter('')
      }
    } catch {
      toast.error('Failed to load workshop settings')
    } finally {
      setLoadingSettings(false)
    }
  }, [])

  useEffect(() => {
    if (selectedWorkshopId) {
      loadWorkshopSettings(selectedWorkshopId)
    }
  }, [selectedWorkshopId, loadWorkshopSettings])

  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId)

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/super-admin"
            className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm no-underline"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-grey-dark tracking-tight">Workshop Settings</h1>
            <p className="text-xs text-grey">Edit branding, notifications, and content for any workshop.</p>
          </div>
        </div>

        {loadingWorkshops ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="bg-white border border-grey-medium/10 rounded-base p-4 shadow-sm">
              <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Building2 size={14} />
                Select Workshop
              </label>
              <div className="relative">
                <select
                  value={selectedWorkshopId ?? ''}
                  onChange={(e) => setSelectedWorkshopId(e.target.value || null)}
                  className="w-full appearance-none rounded-base border border-grey-light bg-white py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
                >
                  <option value="">-- Choose a workshop --</option>
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (/{w.slug})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-grey pointer-events-none" />
              </div>
            </div>

            {!selectedWorkshopId && (
              <div className="bg-white border border-grey-medium/10 rounded-base p-12 shadow-sm flex flex-col items-center justify-center gap-2 text-center">
                <Building2 size={32} className="text-grey-medium" />
                <p className="text-sm font-semibold text-grey-dark">No workshop selected</p>
                <p className="text-xs text-grey">Choose a workshop above to view and edit its settings.</p>
              </div>
            )}

            {selectedWorkshopId && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  <span className="text-sm font-bold text-grey-dark">{selectedWorkshop?.name ?? 'Workshop'}</span>
                </div>

                <div className="flex items-center gap-1 bg-white border border-grey-medium/10 rounded-base p-1 shadow-sm overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-base text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                          activeTab === tab.id
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

                {loadingSettings ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
                    {activeTab === 'notifications' && (
                      <NotificationsForm
                        settings={bizSettings}
                        workshopId={selectedWorkshopId}
                        onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
                      />
                    )}
                    {activeTab === 'whatsapp' && (
                      <WhatsAppForm
                        settings={bizSettings}
                        workshopId={selectedWorkshopId}
                        onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
                      />
                    )}
                    {activeTab === 'email' && (
                      <EmailForm
                        settings={bizSettings}
                        workshopId={selectedWorkshopId}
                        onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
                      />
                    )}
                    {activeTab === 'branding' && (
                      <BrandingForm
                        settings={bizSettings}
                        workshopId={selectedWorkshopId}
                        onUpdate={(s) => setBizSettings((prev) => ({ ...prev, ...s }))}
                      />
                    )}
                    {activeTab === 'website_copy' && (
                      <WebsiteCopyForm
                        initialData={websiteCopy}
                        workshopId={selectedWorkshopId}
                        onSaved={() => loadWorkshopSettings(selectedWorkshopId)}
                      />
                    )}
                    {activeTab === 'homepage_content' && (
                      <HomepageContentForm
                        initialData={homePageContent}
                        workshopId={selectedWorkshopId}
                        heroImageUrl={heroImageUrl}
                        onSaved={() => loadWorkshopSettings(selectedWorkshopId)}
                      />
                    )}
                    {activeTab === 'legal' && (
                      <LegalSettingsForm
                        termsConditions=""
                        documentFooter={documentFooter}
                        workshopId={selectedWorkshopId}
                        onTermsChange={() => {}}
                        onDocumentFooterChange={setDocumentFooter}
                      />
                    )}
                    {activeTab === 'email_templates' && (
                      <EmailTemplatesForm workshopId={selectedWorkshopId} />
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
