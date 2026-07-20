'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AddVehicleModalProps {
  userId: string
  workshopId: string
  onClose: () => void
  onSaved: () => void
}

export function AddVehicleModal({ userId, workshopId, onClose, onSaved }: AddVehicleModalProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    license_plate: '',
    mileage: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.make.trim() || !form.model.trim() || !form.year.trim()) {
      toast.error('Make, model, and year are required')
      return
    }

    setSaving(true)
    const { error } = await (supabase as any)
      .from('vehicles')
      .insert({
        user_id: userId,
        workshop_id: workshopId,
        make: form.make.trim(),
        model: form.model.trim(),
        year: parseInt(form.year),
        license_plate: form.license_plate.trim() || null,
        mileage: form.mileage.trim() || null,
      })

    setSaving(false)

    if (error) {
      toast.error('Failed to add vehicle')
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-base shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-grey-medium/20">
          <h2 className="text-lg font-bold text-grey-dark">Add Vehicle</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-base text-grey hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Make *</label>
              <input
                type="text"
                required
                value={form.make}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Model *</label>
              <input
                type="text"
                required
                value={form.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g. Corolla"
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Year *</label>
              <input
                type="number"
                required
                value={form.year}
                onChange={(e) => handleChange('year', e.target.value)}
                placeholder="e.g. 2019"
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">License Plate</label>
              <input
                type="text"
                value={form.license_plate}
                onChange={(e) => handleChange('license_plate', e.target.value)}
                placeholder="e.g. JHB 123 GP"
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Mileage</label>
            <input
              type="text"
              value={form.mileage}
              onChange={(e) => handleChange('mileage', e.target.value)}
              placeholder="e.g. 85,000 km"
              className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-base bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
