'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Car, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  license_plate?: string | null
  mileage?: string | null
  created_at: string | null
}

export default function ClientGaragePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    async function fetchGarage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      setVehicles(data ?? [])
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
          <Link href="/dashboard" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-grey-dark tracking-tight">Your Digital Garage</h1>
            <p className="text-xs text-grey">Manage registered vehicles for rapid diagnostic deployment configuration loops.</p>
          </div>
        </div>
        <Link href="/onboarding/vehicle?source=dashboard">
          <Button size="sm" className="bg-primary text-white font-bold flex items-center gap-1.5 shadow-sm">
            <Plus size={14} />
            <span>Add Vehicle</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-full bg-white border border-grey-medium/10 rounded-base p-12 text-center text-grey text-sm shadow-sm">
            Your garage is empty. Add a vehicle to map accurate service tracking layouts.
          </div>
        ) : (
          vehicles.map((car) => (
            <div key={car.id} className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary/5 text-primary rounded-base shrink-0">
                  <Car size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-grey-dark text-base">{car.year} {car.make}</span>
                  <span className="text-sm text-grey font-medium">{car.model}</span>
                  {car.license_plate && (
                    <span className="text-[11px] font-mono tracking-wider text-grey-medium mt-1 bg-white px-1.5 py-0.5 rounded border border-grey-medium/10 w-fit">
                      {car.license_plate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}