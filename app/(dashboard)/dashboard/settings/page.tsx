'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getRoleFromSession } from '@/lib/supabase'

export default function SettingsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkRoleAndRedirect() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      const role = getRoleFromSession(session) ?? 'client'
      if (role === 'admin') {
        router.replace('/dashboard/admin/settings')
      } else {
        router.replace('/dashboard/client/settings')
      }
    }
    checkRoleAndRedirect()
  }, [router])

  return null
}
