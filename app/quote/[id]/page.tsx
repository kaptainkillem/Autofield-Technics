export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { CustomerBookingForm } from '@/components/customer/CustomerBookingForm'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FileText, Wrench, User, CheckCircle, Clock } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { id } = await params
  const supabase = createSupabaseAdminClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, service_type, description, status, estimated_quote')
    .eq('id', id)
    .single()

  if (!quote) {
    notFound()
  }

  const { data: existingAppointment } = await supabase
    .from('appointments')
    .select('id, scheduled_date, scheduled_time, status')
    .eq('quote_id', id)
    .neq('status', 'cancelled')
    .single()

  const isAccepted = quote.status === 'accepted'
  const hasAppointment = !!existingAppointment

  return (
    <>
      <div className="bg-grey-lightest border-t border-b border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-4xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Quote Details' },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 py-12 md:px-20 md:py-16">
        <div className="mx-auto max-w-4xl flex flex-col gap-8">
          {/* Header */}
          <div className="border-b border-grey-light pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-base bg-primary/10 flex items-center justify-center">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-grey-dark">Quote Details</h1>
                <p className="text-xs text-grey">Quote #{id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="mt-4">
              {quote.status === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                  <Clock size={12} />
                  Awaiting Quote
                </span>
              )}
              {quote.status === 'sent' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                  <FileText size={12} />
                  Quote Sent
                </span>
              )}
              {quote.status === 'accepted' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                  <CheckCircle size={12} />
                  Quote Accepted
                </span>
              )}
              {quote.status === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-grey-light border border-grey-medium/20 text-grey text-xs font-bold">
                  <CheckCircle size={12} />
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Quote Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 bg-grey-lightest/50 rounded-base p-5 border border-grey-light/50">
              <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Customer</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-grey-dark">
                  <User size={14} className="text-primary" />
                  {quote.customer_name}
                </div>
                {quote.customer_email && (
                  <div className="text-xs text-grey">{quote.customer_email}</div>
                )}
                <div className="text-xs text-grey">{quote.customer_phone}</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-grey-lightest/50 rounded-base p-5 border border-grey-light/50">
              <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Vehicle</h3>
              <div className="flex items-center gap-2 text-sm text-grey-dark">
                <Wrench size={14} className="text-primary" />
                {[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'Not specified'}
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-grey-lightest/50 rounded-base p-5 border border-grey-light/50 md:col-span-2">
              <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Service Requested</h3>
              <div className="text-sm font-semibold text-grey-dark">
                {quote.service_type ?? 'General Service'}
              </div>
              <p className="text-xs text-grey leading-relaxed">{quote.description}</p>
            </div>

            {quote.estimated_quote && (
              <div className="flex flex-col gap-4 bg-primary/5 rounded-base p-5 border border-primary/10 md:col-span-2">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Estimated Quote</h3>
                <div className="text-2xl font-extrabold text-grey-dark">
                  R {Number(quote.estimated_quote).toLocaleString('en-ZA')}
                </div>
              </div>
            )}
          </div>

          {/* Booking Section */}
          {isAccepted && (
            <div className="border-t border-grey-light pt-8">
              {hasAppointment ? (
                <div className="bg-green-50 border border-green-200 rounded-base p-6 flex flex-col items-center gap-3 text-center">
                  <CheckCircle size={32} className="text-green-600" />
                  <h3 className="text-lg font-bold text-grey-dark">Appointment Requested</h3>
                  <p className="text-sm text-grey max-w-md">
                    Your appointment has been submitted for{' '}
                    <strong>
                      {existingAppointment?.scheduled_date} at {existingAppointment?.scheduled_time?.slice(0, 5)}
                    </strong>
                    . The mechanic will confirm your slot shortly.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-grey-dark mb-1">Book Your Appointment</h3>
                  <p className="text-xs text-grey mb-6">
                    Your quote has been accepted. Select a date and time to schedule your service.
                  </p>
                  <CustomerBookingForm quoteId={id} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
