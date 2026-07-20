'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, getWorkshopIdFromSession } from '@/lib/supabase'
import { toast } from 'sonner'
import { Car, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VehicleFormModal } from './VehicleFormModal'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate?: string | null
  mileage?: string | null
  created_at: string | null
}

interface ClientGarageFormProps {
  userId: string
}

export function ClientGarageForm({ userId }: ClientGarageFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [workshopId, setWorkshopId] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setVehicles(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setWorkshopId(getWorkshopIdFromSession(session) ?? '')
    })
  }, [])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  function handleEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditingVehicle(null)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingVehicle(null)
  }

  function handleSaved() {
    setModalOpen(false)
    setEditingVehicle(null)
    fetchVehicles()
  }

  async function handleDelete(vehicleId: string) {
    if (!confirm('Are you sure you want to remove this vehicle from your garage?')) {
      return
    }

    setDeletingId(vehicleId)
    const { error } = await (supabase as any)
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)

    setDeletingId(null)

    if (error) {
      toast.error('Failed to remove vehicle')
      return
    }

    toast.success('Vehicle removed from garage')
    fetchVehicles()
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] w-full items-center justify-center">
        <Car className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">My Garage</h3>
          <p className="text-xs text-grey">
            Save your vehicles for faster booking and accurate service quotes.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          className="bg-primary text-white font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={14} />
          <span>Add Vehicle</span>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white border border-grey-medium/10 rounded-base p-12 text-center shadow-sm">
          <Car className="h-10 w-10 text-grey-medium mx-auto mb-3" />
          <p className="text-grey-dark font-semibold text-sm mb-1">Your garage is empty</p>
          <p className="text-grey text-xs mb-4">
            Add your vehicles here to speed up quote requests and service bookings.
          </p>
          <Button
            size="sm"
            onClick={handleAdd}
            className="bg-primary text-white font-bold flex items-center gap-1.5 shadow-sm mx-auto"
          >
            <Plus size={14} />
            <span>Add Your First Vehicle</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((car) => (
            <div
              key={car.id}
              className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary/5 text-primary rounded-base shrink-0">
                  <Car size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-grey-dark text-base truncate">
                    {car.year} {car.make}
                  </span>
                  <span className="text-sm text-grey font-medium">{car.model}</span>
                  {car.license_plate && (
                    <span className="text-[11px] font-mono tracking-wider text-grey-medium mt-1 bg-grey-lightest px-1.5 py-0.5 rounded border border-grey-medium/10 w-fit">
                      {car.license_plate}
                    </span>
                  )}
                  {car.mileage && (
                    <span className="text-xs text-grey mt-1">{car.mileage}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-grey-light/60">
                <button
                  type="button"
                  onClick={() => handleEdit(car)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-xs font-semibold text-grey hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(car.id)}
                  disabled={deletingId === car.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-base text-xs font-semibold text-grey hover:text-error hover:bg-error/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deletingId === car.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <VehicleFormModal
          userId={userId}
          workshopId={workshopId}
          vehicle={editingVehicle}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
