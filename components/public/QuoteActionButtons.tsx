'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, FileDown } from 'lucide-react'
import { CustomerBookingForm } from '@/components/customer/CustomerBookingForm'
import { toast } from 'sonner'

interface QuoteActionButtonsProps {
  quoteId: string
  status: string
  pdfUrl: string | null
  existingAppointment: {
    id: string
    scheduled_date: string | null
    scheduled_time: string | null
    status: string | null
  } | null
}

export function QuoteActionButtons({ quoteId, status, pdfUrl, existingAppointment }: QuoteActionButtonsProps) {
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [localStatus, setLocalStatus] = useState(status)
  const [showBooking, setShowBooking] = useState(false)

  async function handleAction(action: 'accept' | 'decline') {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch(`/api/quotes/${quoteId}/customer-action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setLocalStatus(data.quote.status)
      if (action === 'accept') {
        toast.success('Quote accepted!')
        setShowBooking(true)
      } else {
        toast.success('Quote declined')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setActionError(msg)
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  if (localStatus === 'accepted') {
    if (showBooking && !existingAppointment) {
      return (
        <div className="border-t border-grey-light pt-8">
          <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
            <h3 className="text-lg font-bold text-grey-dark mb-1">Book Your Appointment</h3>
            <p className="text-xs text-grey mb-6">
              Your quote has been accepted. Select a date and time to schedule your service.
            </p>
            <CustomerBookingForm quoteId={quoteId} />
          </div>
        </div>
      )
    }

    if (existingAppointment) {
      return (
        <div className="border-t border-grey-light pt-8">
          <div className="bg-green-50 border border-green-200 rounded-base p-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle size={32} className="text-green-600" />
            <h3 className="text-lg font-bold text-grey-dark">Appointment Requested</h3>
            <p className="text-sm text-grey max-w-md">
              Your appointment has been submitted for{' '}
              <strong>
                {existingAppointment.scheduled_date} at {existingAppointment.scheduled_time?.slice(0, 5)}
              </strong>
              . The mechanic will confirm your slot shortly.
            </p>
          </div>
        </div>
      )
    }

    return null
  }

  if (localStatus === 'cancelled') {
    return (
      <div className="border-t border-grey-light pt-8">
        <div className="bg-red-50 border border-red-200 rounded-base p-6 flex flex-col items-center gap-3 text-center">
          <XCircle size={32} className="text-red-600" />
          <h3 className="text-lg font-bold text-grey-dark">Quote Declined</h3>
          <p className="text-sm text-grey max-w-md">
            You have declined this quote. If you change your mind, please contact us directly.
          </p>
        </div>
      </div>
    )
  }

  if (localStatus !== 'sent') return null

  return (
    <div className="border-t border-grey-light pt-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-grey-dark">Review Your Quote</h3>

        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-base p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleAction('accept')}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-base shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Accept Quote
          </button>

          <button
            type="button"
            onClick={() => handleAction('decline')}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-base shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle size={16} />
            Decline
          </button>

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-grey-medium/20 text-grey-dark hover:bg-grey-lightest text-sm font-semibold rounded-base shadow-sm transition-all"
            >
              <FileDown size={16} />
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
