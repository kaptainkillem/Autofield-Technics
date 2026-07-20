'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, FileDown, CalendarClock } from 'lucide-react'
import { CustomerBookingForm } from '@/components/customer/CustomerBookingForm'
import { toast } from 'sonner'

interface QuoteActionButtonsProps {
  quoteId: string
  quoteToken?: string | null
  status: string
  pdfUrl: string | null
  existingAppointment: {
    id: string
    scheduled_date: string | null
    scheduled_time: string | null
    status: string | null
    proposed_date: string | null
    proposed_time: string | null
    proposed_notes: string | null
  } | null
}

export function QuoteActionButtons({ quoteId, quoteToken, status, pdfUrl, existingAppointment }: QuoteActionButtonsProps) {
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [localStatus, setLocalStatus] = useState(status)
  const [showBooking, setShowBooking] = useState(false)
  const [proposalResponse, setProposalResponse] = useState<'accepted' | 'declined' | null>(null)

  async function handleAction(action: 'accept' | 'decline') {
    setActionLoading(true)
    setActionError('')
    try {
      const body: Record<string, unknown> = { action }
      if (quoteToken) body.quote_token = quoteToken
      const res = await fetch(`/api/quotes/${quoteId}/customer-action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        const returnUrl = `/quote/${quoteId}${quoteToken ? `?token=${quoteToken}` : ''}`
        window.location.href = `/signin?redirect=${encodeURIComponent(returnUrl)}`
        return
      }
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

  async function handleProposalResponse(action: 'accept' | 'decline') {
    if (!existingAppointment) return
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch(`/api/appointments/${existingAppointment.id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      const response = action === 'accept' ? 'accepted' : 'declined'
      setProposalResponse(response)
      if (action === 'accept') {
        toast.success('New date accepted! Your appointment is confirmed.')
      } else {
        toast.success('Proposal declined. The mechanic will suggest another time.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setActionError(msg)
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle proposed appointment
  if (existingAppointment?.status === 'proposed' && localStatus === 'accepted') {
    if (proposalResponse === 'accepted') {
      return (
        <div className="border-t border-grey-light pt-8">
          <div className="bg-green-50 border border-green-200 rounded-base p-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle size={32} className="text-green-600" />
            <h3 className="text-lg font-bold text-grey-dark">Appointment Confirmed</h3>
            <p className="text-sm text-grey max-w-md">
              Your appointment has been confirmed for{' '}
              <strong>
                {existingAppointment.proposed_date} at {existingAppointment.proposed_time?.slice(0, 5)}
              </strong>
              . We look forward to seeing you!
            </p>
          </div>
        </div>
      )
    }

    if (proposalResponse === 'declined') {
      return (
        <div className="border-t border-grey-light pt-8">
          <div className="bg-amber-50 border border-amber-200 rounded-base p-6 flex flex-col items-center gap-3 text-center">
            <CalendarClock size={32} className="text-amber-600" />
            <h3 className="text-lg font-bold text-grey-dark">Proposal Declined</h3>
            <p className="text-sm text-grey max-w-md">
              The mechanic will suggest another time. You will be notified when a new date is proposed.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="border-t border-grey-light pt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-base p-6">
          <div className="flex flex-col items-center gap-3 text-center mb-4">
            <CalendarClock size={32} className="text-blue-600" />
            <h3 className="text-lg font-bold text-grey-dark">New Date Proposed</h3>
            <p className="text-sm text-grey max-w-md">
              The mechanic proposed a new date for your appointment:
            </p>
          </div>

          <div className="bg-white rounded-base border border-blue-100 p-4 mb-4">
            <div className="flex items-center gap-3 justify-center">
              <div className="text-center">
                <p className="text-xs text-grey uppercase tracking-wider mb-1">Date</p>
                <p className="text-lg font-bold text-grey-dark">{existingAppointment.proposed_date}</p>
              </div>
              <div className="w-px h-10 bg-grey-medium/20" />
              <div className="text-center">
                <p className="text-xs text-grey uppercase tracking-wider mb-1">Time</p>
                <p className="text-lg font-bold text-grey-dark">{existingAppointment.proposed_time?.slice(0, 5)}</p>
              </div>
            </div>
            {existingAppointment.proposed_notes && (
              <p className="text-sm text-grey mt-3 pt-3 border-t border-grey-light text-center">
                &ldquo;{existingAppointment.proposed_notes}&rdquo;
              </p>
            )}
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-base p-3 text-sm text-red-700 mb-4">
              {actionError}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => handleProposalResponse('accept')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-base shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Accept New Date
            </button>

            <button
              type="button"
              onClick={() => handleProposalResponse('decline')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-base shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={16} />
              Decline & Request Another
            </button>
          </div>
        </div>
      </div>
    )
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
            <CustomerBookingForm quoteId={quoteId} quoteToken={quoteToken ?? undefined} />
          </div>
        </div>
      )
    }

    if (existingAppointment) {
      const isPending = existingAppointment.status === 'pending'
      const isConfirmed = existingAppointment.status === 'confirmed'

      return (
        <div className="border-t border-grey-light pt-8">
          <div className={`border rounded-base p-6 flex flex-col items-center gap-3 text-center ${
            isConfirmed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}>
            {isConfirmed ? (
              <CheckCircle size={32} className="text-green-600" />
            ) : (
              <CalendarClock size={32} className="text-amber-600" />
            )}
            <h3 className="text-lg font-bold text-grey-dark">
              {isConfirmed ? 'Appointment Confirmed' : 'Appointment Requested'}
            </h3>
            <p className="text-sm text-grey max-w-md">
              {isConfirmed ? 'Your appointment is confirmed for' : 'Your appointment has been submitted for'}{' '}
              <strong>
                {existingAppointment.scheduled_date} at {existingAppointment.scheduled_time?.slice(0, 5)}
              </strong>
              . {isPending && 'The mechanic will confirm your slot shortly.'}
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
              href={`/api/quotes/${quoteId}/pdf/download${quoteToken ? `?token=${quoteToken}` : ''}`}
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
