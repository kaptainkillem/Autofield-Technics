'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkOrder } from '@/components/admin/WorkOrderPanel'

interface RevisionCardProps {
  workOrder: WorkOrder
  onRespond?: () => void
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

export function RevisionCard({ workOrder, onRespond }: RevisionCardProps) {
  const [responding, setResponding] = useState(false)
  const [responded, setResponded] = useState(workOrder.revision_approved !== null && workOrder.revision_approved !== undefined)

  const items: LineItem[] = Array.isArray(workOrder.additional_work_items)
    ? workOrder.additional_work_items
    : []

  async function handleRespond(action: 'accept' | 'decline') {
    setResponding(true)
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to respond')
        return
      }

      toast.success(data.message)
      setResponded(true)
      onRespond?.()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setResponding(false)
    }
  }

  if (responded) {
    return (
      <div className="bg-white border border-grey-medium/10 rounded-base p-5">
        <p className="text-sm font-semibold text-grey-dark mb-1">Additional Work</p>
        <p className="text-xs text-grey">
          You have {workOrder.revision_approved ? 'accepted' : 'declined'} the additional work proposal.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-base p-5">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-grey-dark">Additional Work Required</h3>
          <p className="text-xs text-grey mt-0.5">
            The mechanic found additional work needed on your vehicle.
          </p>
        </div>
      </div>

      {workOrder.client_visible_notes && (
        <p className="text-xs text-grey italic mb-4">&ldquo;{workOrder.client_visible_notes}&rdquo;</p>
      )}

      <div className="bg-white rounded-base border border-amber-100 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="text-left bg-amber-50/50 text-grey-dark border-b border-amber-100">
            <tr>
              <th className="py-2 px-3 font-semibold text-xs">Item</th>
              <th className="py-2 px-3 font-semibold text-xs">Qty</th>
              <th className="py-2 px-3 font-semibold text-xs text-right">Unit</th>
              <th className="py-2 px-3 font-semibold text-xs text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-amber-50 last:border-0">
                <td className="py-2 px-3 text-grey-dark">{item.name}</td>
                <td className="py-2 px-3 text-grey-dark">{item.qty}</td>
                <td className="py-2 px-3 text-grey text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 px-3 text-grey text-right">{formatCurrency(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-grey-dark">Additional total:</span>
        <span className="text-lg font-bold text-grey-dark">{formatCurrency(workOrder.additional_work_total)}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleRespond('accept')}
          disabled={responding}
          className="flex-1 bg-green-600 text-white font-bold py-2.5 px-4 rounded-base text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition disabled:opacity-50"
        >
          {responding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Accept & Add to Quote
        </button>
        <button
          onClick={() => handleRespond('decline')}
          disabled={responding}
          className="flex-1 bg-white text-grey-dark border border-grey-medium/20 font-bold py-2.5 px-4 rounded-base text-sm flex items-center justify-center gap-2 hover:bg-grey-lightest transition disabled:opacity-50"
        >
          <XCircle size={14} />
          Decline
        </button>
      </div>

      <p className="text-[10px] text-grey mt-3">
        Accepting will update your quote total. You can view the updated quote from your quote details.
      </p>
    </div>
  )
}
