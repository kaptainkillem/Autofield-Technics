'use client'

import {
  ClipboardCheck,
  Wrench,
  Package,
  FileQuestion,
  CheckCircle,
  Flag,
} from 'lucide-react'
import type { WorkOrder } from '@/components/admin/WorkOrderPanel'

interface WorkshopTrackerProps {
  workOrder: WorkOrder
}

const STATUS_FLOW = [
  { key: 'checked_in', label: 'Checked In', icon: ClipboardCheck, description: 'Your vehicle has arrived at the workshop.' },
  { key: 'in_progress', label: 'In Progress', icon: Wrench, description: 'The mechanic is actively working on your vehicle.' },
  { key: 'awaiting_parts', label: 'Awaiting Parts', icon: Package, description: 'We are waiting for parts to arrive before continuing.' },
  { key: 'revision_pending', label: 'Revision Pending', icon: FileQuestion, description: 'Additional work has been identified and is awaiting your approval.' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: CheckCircle, description: 'Your vehicle is ready. Come collect it when convenient.' },
  { key: 'completed', label: 'Completed', icon: Flag, description: 'Job closed. Thank you for choosing us.' },
]

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function WorkshopTracker({ workOrder }: WorkshopTrackerProps) {
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === workOrder.status)
  const currentStep = STATUS_FLOW[currentIdx] ?? STATUS_FLOW[0]

  return (
    <div className="bg-grey-lightest border border-grey-medium/10 rounded-base p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-grey-dark">Live Workshop Tracker</h3>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-base">
          {formatStatusLabel(workOrder.status)}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative mb-5">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-grey-light" />
        <div className="relative flex justify-between">
          {STATUS_FLOW.map((step, idx) => {
            const Icon = step.icon
            const isActive = idx <= currentIdx
            const isCurrent = idx === currentIdx

            return (
              <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isCurrent
                      ? 'bg-primary text-white border-primary shadow-md'
                      : isActive
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-white text-grey border-grey-light'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-[10px] font-semibold text-center max-w-[60px] leading-tight ${
                    isCurrent ? 'text-primary' : isActive ? 'text-grey-dark' : 'text-grey'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current status detail */}
      <div className="bg-white rounded-base p-4 border border-grey-medium/10">
        <p className="text-sm font-semibold text-grey-dark mb-1">
          Your vehicle is currently: {formatStatusLabel(workOrder.status)}
        </p>
        <p className="text-xs text-grey">{currentStep.description}</p>

        {workOrder.client_visible_notes && (
          <div className="mt-3 pt-3 border-t border-grey-light">
            <p className="text-xs font-semibold text-grey-dark mb-1">Mechanic note:</p>
            <p className="text-xs text-grey italic">&ldquo;{workOrder.client_visible_notes}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  )
}
