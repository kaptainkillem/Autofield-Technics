'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Settings, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ClientSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    async function fetchProfileData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      // Fetch from profiles tracking table using modern layout syntax helper
      const { data } = await (supabase as any)
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()

      setProfile({
        fullName: data?.full_name ?? user.user_metadata?.full_name ?? '',
        phone: data?.phone ?? '',
        email: user.email ?? '',
      })
      setLoading(false)
    }
    fetchProfileData()
  }, [router])

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update metadata layer and profiles relation simultaneously
    const [metaUpdate, profileUpdate] = await Promise.all([
      supabase.auth.updateUser({
        data: { full_name: profile.fullName.trim() }
      }),
      (supabase as any).from('profiles').upsert({
        id: user.id,
        full_name: profile.fullName.trim(),
        phone: profile.phone.trim(),
      })
    ])

    setSaving(false)

    if (metaUpdate.error || profileUpdate.error) {
      setError('Could not complete changes update profiles sync.')
      toast.error('Failed to save settings')
      return
    }

    toast.success('Settings updated successfully!')
    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Settings className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[600px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">Account Workspace Settings</h1>
          <p className="text-xs text-grey">Manage your unique client parameters and phone contact lines.</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Registered Email Address</label>
          <input
            type="text"
            disabled
            value={profile.email}
            className="w-full rounded-base border border-grey-light bg-grey-lightest py-2.5 px-3 text-sm text-grey-medium cursor-not-allowed opacity-70"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Your Full Name</label>
          <input
            type="text"
            required
            value={profile.fullName}
            onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">WhatsApp Core Contact Line</label>
          <input
            type="tel"
            required
            value={profile.phone}
            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
          />
        </div>

        {error && <p className="text-xs text-error font-semibold">{error}</p>}
        {success && <p className="text-xs text-success font-semibold">Workspace metadata rows synced cleanly!</p>}

        <Button type="submit" disabled={saving} className="w-full bg-primary text-white font-bold py-3 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          <span>{saving ? 'Saving System States...' : 'Update Settings Profiles'}</span>
        </Button>
      </form>
    </div>
  )
}