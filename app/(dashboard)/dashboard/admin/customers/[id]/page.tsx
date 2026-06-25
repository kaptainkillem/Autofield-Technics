'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MessageCircle,
  Pencil,
  Car,
  Plus,
  FileText,
  Clock,
  MapPin,
  Phone,
  User,
  Loader2,
} from 'lucide-react'
import { Database } from '@/types/database'
import { EditClientForm } from '@/components/admin/EditClientForm'
import { AddVehicleModal } from '@/components/admin/AddVehicleModal'

type Profile = Database['public']['Tables']['profiles']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Quote = Database['public']['Tables']['quotes']['Row']

function statusBadgeColor(status: string | null) {
  switch (status) {
    case 'vip': return 'bg-yellow-100 text-yellow-700'
    case 'blacklisted': return 'bg-red-100 text-red-700'
    default: return 'bg-green-100 text-green-700'
  }
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [addVehicleOpen, setAddVehicleOpen] = useState(false)

  async function fetchData() {
    setLoading(true)
    const [profileRes, vehiclesRes, quotesRes] = await Promise.all([
      (supabase as any).from('profiles').select('*').eq('id', id).single(),
      (supabase as any).from('vehicles').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      (supabase as any).from('quotes').select('*').eq('user_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
    ])

    if (profileRes.error) {
      toast.error('Failed to load customer')
      router.push('/dashboard/admin/customers')
      return
    }

    setProfile(profileRes.data)
    setVehicles(vehiclesRes.data ?? [])
    setQuotes(quotesRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  if (loading || !profile) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  const name = profile.full_name ?? 'Unknown'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const status = profile.client_status ?? 'active'
  const whatsappNumber = profile.whatsapp_number || profile.phone || profile.alternate_phone

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1000px] mx-auto w-full mt-4">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/customers" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-grey-dark tracking-tight truncate">{name}</h1>
          <p className="text-xs text-grey">Customer Command Center</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-base bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-base bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm cursor-pointer"
          >
            <Pencil size={16} />
            Edit Client
          </button>
        </div>
      </div>

      {/* Status & Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white text-lg font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-grey-dark">{name}</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${statusBadgeColor(status)}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-grey">
            <Phone size={14} />
            <span className="text-xs font-bold uppercase tracking-wide">Primary Contact</span>
          </div>
          <p className="text-sm font-mono text-grey-dark">{profile.phone ?? '—'}</p>
          {profile.alternate_phone && (
            <p className="text-xs text-grey font-mono">Alt: {profile.alternate_phone}</p>
          )}
        </div>

        <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-grey">
            <MapPin size={14} />
            <span className="text-xs font-bold uppercase tracking-wide">Address</span>
          </div>
          <p className="text-sm text-grey-dark">{profile.physical_address ?? '—'}</p>
        </div>
      </div>

      {/* Digital Garage */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-grey-dark">Digital Garage</h2>
          </div>
          <button
            type="button"
            onClick={() => setAddVehicleOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-base border border-grey-medium/10">
            <Car className="h-8 w-8 text-grey-medium mx-auto mb-2" />
            <p className="text-sm text-grey">No vehicles registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="border border-grey-medium/10 rounded-base p-4 bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-grey uppercase tracking-wide">{v.year}</span>
                  {v.license_plate && (
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-base">
                      {v.license_plate}
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-grey-dark">{v.make} {v.model}</p>
                {v.mileage && (
                  <p className="text-xs text-grey">Mileage: {v.mileage}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internal Notes */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-grey-dark">Internal Notes</h2>
          <span className="text-[10px] font-bold text-grey-medium bg-white px-2 py-0.5 rounded-full uppercase">Private</span>
        </div>
        {profile.internal_notes ? (
          <p className="text-sm text-grey-dark whitespace-pre-wrap leading-relaxed">{profile.internal_notes}</p>
        ) : (
          <p className="text-sm text-grey italic">No internal notes recorded.</p>
        )}
      </div>

      {/* Quote History */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-grey-dark">Quote History</h2>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-base border border-grey-medium/10">
            <FileText className="h-8 w-8 text-grey-medium mx-auto mb-2" />
            <p className="text-sm text-grey">No quotes on record.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-4 rounded-base bg-white border border-grey-medium/10 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-grey-dark">
                    {q.vehicle_year} {q.vehicle_make} {q.vehicle_model}
                  </p>
                  <p className="text-xs text-grey">{q.description ?? 'No description'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    q.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-white text-grey-dark'
                  }`}>
                    {q.status ?? 'new'}
                  </span>
                  <span className="text-xs text-grey-medium flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(q.created_at).toLocaleDateString('en-ZA')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editOpen && (
        <EditClientForm
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            fetchData()
            toast.success('Client updated successfully')
          }}
        />
      )}

      {addVehicleOpen && (
        <AddVehicleModal
          userId={id}
          onClose={() => setAddVehicleOpen(false)}
          onSaved={() => {
            setAddVehicleOpen(false)
            fetchData()
            toast.success('Vehicle added successfully')
          }}
        />
      )}
    </div>
  )
}
