'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkOrder } from '@/components/admin/WorkOrderPanel'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

interface AdditionalWorkModalProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder
  onSuccess: () => void
}

interface LineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

function formatCurrency(amount: number): string {
  return `R${amount.toFixed(2)}`
}

export function AdditionalWorkModal({ isOpen, onClose, workOrder, onSuccess }: AdditionalWorkModalProps) {
  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), name: '', qty: 1, unitPrice: 0 },
  ])
  const [clientVisibleNotes, setClientVisibleNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const prevIsOpen = useRef(false)

  const resetForm = useCallback(() => {
    setItems([{ id: generateId(), name: '', qty: 1, unitPrice: 0 }])
    setClientVisibleNotes('')
  }, [])

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      resetForm()
    }
    prevIsOpen.current = isOpen
  }, [isOpen, resetForm])

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (field === 'qty') {
          return { ...item, qty: Math.max(1, Number(value)) }
        }
        if (field === 'unitPrice') {
          return { ...item, unitPrice: Math.max(0, Number(value)) }
        }
        return { ...item, [field]: value }
      })
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addItem = () => {
    setItems((prev) => [...prev, { id: generateId(), name: '', qty: 1, unitPrice: 0 }])
  }

  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const isValid = items.every((item) => item.name.trim().length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}/revision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          client_visible_notes: clientVisibleNotes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to submit additional work')
        return
      }

      toast.success('Additional work request submitted. Client will be notified.')
      onSuccess()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-base shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-grey-medium/20">
          <div>
            <h2 className="text-lg font-bold text-grey-dark">Request Additional Work</h2>
            <p className="text-xs text-grey mt-0.5">
              Items will be added to the quote if the client accepts.
            </p>
          </div>
          <button onClick={onClose} className="text-grey hover:text-grey-dark transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-start bg-grey-lightest rounded-base p-3">
                <div className="col-span-6 flex flex-col gap-1">
                  <label className="text-xs font-medium text-grey-dark">Item name</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    placeholder="e.g. Rear brake rotors"
                    className="w-full rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-grey-dark">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                    className="w-full rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-3 flex flex-col gap-1">
                  <label className="text-xs font-medium text-grey-dark">Unit price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-1 flex items-end justify-end h-full pb-1">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="self-start text-sm font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
            >
              <Plus size={16} />
              Add line item
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-grey-light">
            <span className="text-sm text-grey">Additional total:</span>
            <span className="text-lg font-bold text-grey-dark">{formatCurrency(total)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-grey-dark">Note to Client (optional)</label>
            <textarea
              value={clientVisibleNotes}
              onChange={(e) => setClientVisibleNotes(e.target.value)}
              placeholder="e.g. The rotors are below minimum thickness and must be replaced for safety."
              maxLength={500}
              rows={3}
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-xs text-grey text-right">{clientVisibleNotes.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="bg-primary text-white font-bold py-3 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{submitting ? 'Submitting...' : 'Submit Additional Work'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
