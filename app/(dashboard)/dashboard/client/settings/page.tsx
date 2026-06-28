'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Settings, ArrowLeft, Loader2, User, Car, Bell, Shield,
} from 'lucide-react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ClientProfileForm } from '@/components/settings/ClientProfileForm'
import { ClientGarageForm } from '@/components/settings/ClientGarageForm'
import { ClientNotificationsForm } from '@/components/settings/ClientNotificationsForm'
import { ClientSecurityForm } from '@/components/settings/ClientSecurityForm'

type Tab = 'profile' | 'garage' | 'notifications' | 'security'

interface ProfileData {
  full_name: string
  phone: string
  physical_address: string
  notification_quotes_whatsapp: boolean
  notification_appointments_email: boolean
  notification_marketing: boolean
}

const defaultProfile: ProfileData = {
  full_name: '',
  phone: '',
  physical_address: '',
  notification_quotes_whatsapp: true,
  notification_appointments_email: true,
  notification_marketing: false,
}

const tabs = [
  { id: 'profile' as Tab, label: 'My Profile', icon: User },
  { id: 'garage' as Tab, label: 'My Garage', icon: Car },
  { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
  { id: 'security' as Tab, label: 'Security', icon: Shield },
]

export default function ClientSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      // Redirect admins to admin settings
      const role = user.user_metadata?.role ?? 'client'
      if (role === 'admin') {
        router.replace('/dashboard/admin/settings')
        return
      }

      setUserId(user.id)
      setEmail(user.email ?? '')

      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          physical_address: data.physical_address ?? '',
          notification_quotes_whatsapp: data.notification_quotes_whatsapp ?? true,
          notification_appointments_email: data.notification_appointments_email ?? true,
          notification_marketing: data.notification_marketing ?? false,
        })
      } else {
        setProfile((prev) => ({
          ...prev,
          full_name: user.user_metadata?.full_name ?? '',
          phone: user.phone ?? '',
        }))
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Settings className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <PageWrapper className="max-w-[900px] gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs text-grey">
            Manage your profile, vehicles, notifications, and account security.
          </p>
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

      {/* Tab Content */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5 min-h-[400px]">
        {activeTab === 'profile' && (
          <ClientProfileForm
            userId={userId}
            email={email}
            initialData={{
              full_name: profile.full_name,
              phone: profile.phone,
              physical_address: profile.physical_address,
            }}
          />
        )}

        {activeTab === 'garage' && (
          <ClientGarageForm userId={userId} />
        )}

        {activeTab === 'notifications' && (
          <ClientNotificationsForm
            userId={userId}
            initialData={{
              notification_quotes_whatsapp: profile.notification_quotes_whatsapp,
              notification_appointments_email: profile.notification_appointments_email,
              notification_marketing: profile.notification_marketing,
            }}
          />
        )}

        {activeTab === 'security' && (
          <ClientSecurityForm userId={userId} email={email} />
        )}
      </div>
    </PageWrapper>
  )
}
