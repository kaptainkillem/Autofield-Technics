'use client'

import { useState } from 'react'
import { X, Loader2, User, Phone, Mail, Car, Calendar, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AddNewCustomerModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddNewCustomerModal({ onClose, onSuccess }: AddNewCustomerModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    email: '',
    physical_address: '',
  })

  const [vehicle, setVehicle] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    license_plate: '',
    mileage: '',
  })

  function updateProfile(field: string, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  function updateVehicle(field: string, value: string | number) {
    setVehicle((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)

    try {
      const res = await fetch('/api/customers/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim(),
          email: profile.email.trim() || undefined,
          physical_address: profile.physical_address.trim() || undefined,
          vehicle: {
            year: vehicle.year,
            make: vehicle.make.trim(),
            model: vehicle.model.trim(),
            license_plate: vehicle.license_plate.trim() || undefined,
            mileage: vehicle.mileage.trim() || undefined,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Walk-in API error:', data)
        toast.error(data.error || 'Failed to create customer')
        setLoading(false)
        return
      }

      toast.success('Walk-in customer created!')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Network error:', err)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = profile.full_name.trim() && profile.phone.trim()
  const canSubmit = canProceedStep1 && vehicle.make.trim() && vehicle.model.trim()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-base shadow-xl w-full max-w-lg flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-grey-dark">New Walk-in Customer</h4>
            <p className="text-xs text-grey">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="text-grey-medium hover:text-grey-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Customer Info */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
                <User size={12} /> Full Name *
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => updateProfile('full_name', e.target.value)}
                placeholder="e.g., John Smith"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
                <Phone size={12} /> Phone *
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => updateProfile('phone', e.target.value)}
                placeholder="e.g., +27 78 480 2796"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                placeholder="Optional — used for login"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide">Address</label>
              <input
                type="text"
                value={profile.physical_address}
                onChange={(e) => updateProfile('physical_address', e.target.value)}
                placeholder="Physical address"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="bg-primary text-white font-bold py-2.5 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              Next: Vehicle Info
            </Button>
          </div>
        )}

        {/* Step 2: Vehicle Info */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
                  <Calendar size={12} /> Year
                </label>
                <input
                  type="number"
                  value={vehicle.year}
                  onChange={(e) => updateVehicle('year', parseInt(e.target.value) || new Date().getFullYear())}
                  min="1900"
                  max="2030"
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
                  <Hash size={12} /> License Plate
                </label>
                <input
                  type="text"
                  value={vehicle.license_plate}
                  onChange={(e) => updateVehicle('license_plate', e.target.value)}
                  placeholder="ABC 123 GP"
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
                <Car size={12} /> Make *
              </label>
              <input
                type="text"
                value={vehicle.make}
                onChange={(e) => updateVehicle('make', e.target.value)}
                placeholder="e.g., Toyota"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide">Model *</label>
              <input
                type="text"
                value={vehicle.model}
                onChange={(e) => updateVehicle('model', e.target.value)}
                placeholder="e.g., Corolla"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide">Mileage</label>
              <input
                type="text"
                value={vehicle.mileage}
                onChange={(e) => updateVehicle('mileage', e.target.value)}
                placeholder="e.g., 85,000 km"
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setStep(1)}
                className="bg-white text-grey border border-grey-medium/20 font-semibold py-2 px-4 rounded-base hover:bg-grey-lightest transition-all flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2 flex-1 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{loading ? 'Creating...' : 'Create Customer'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
