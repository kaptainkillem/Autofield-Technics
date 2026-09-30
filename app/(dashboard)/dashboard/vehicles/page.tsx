'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Car, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ClientGarageForm } from '@/components/settings/ClientGarageForm'

export default function ClientGaragePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGarage() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      setUserId(user.id)
      setLoading(false)
    }

    fetchGarage()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Car className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1200px] mx-auto w-full mt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>

          <div>
            <h1 className="text-2xl font-black text-grey-dark tracking-tight">
              Your Digital Garage
            </h1>
            <p className="text-xs text-grey">
              Manage registered vehicles for rapid diagnostic deployment configuration loops.
            </p>
          </div>
        </div>
      </div>

      {userId && <ClientGarageForm userId={userId} />}
    </div>
  )
}
