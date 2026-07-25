'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Loader2, ArrowRight, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useSiteConfig } from '@/components/providers/SiteConfigProvider'
import { sanitizePhone, sanitizeText, sanitizeEmail } from '@/lib/input-sanitizer'
import Link from 'next/link'

const SERVICE_OPTIONS = [
  'Oil Change',
  'Maintenance Service',
  'Major Repair',
  'Minor Repair',
  'Engine Service',
  'Brake Repair',
  'Suspension',
  'Electrical',
  'Other',
]

export function QuoteForm({ workshopId }: { workshopId?: string }) {
  const config = useSiteConfig()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAnonymous(false)
      }
    })
  }, [])

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    brand: '',
    model: '',
    year: '',
    vin: '',
    service: SERVICE_OPTIONS[0],
    description: '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    // Force uppercase and limit to 17 characters for VIN safety
    if (name === 'vin') {
      setForm((prev) => ({ ...prev, [name]: value.toUpperCase().slice(0, 17) }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  function buildWhatsAppMessage() {
    return encodeURIComponent(
      [
        `🔧 *${config.quotes.whatsAppPrefix} — ${config.name}*`,
        ``,
        `👤 *Name:* ${form.customerName}`,
        `📞 *Phone:* ${form.customerPhone}`,
        `🚗 *Vehicle:* ${form.brand} ${form.model} (${form.year})`,
        form.vin ? `🆔 *VIN:* ${form.vin}` : '',
        `🛠️ *Service:* ${form.service}`,
        ``,
        `📝 *Description:*`,
        form.description || 'No description provided.',
      ].filter(Boolean).join('\n')
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Append VIN metadata cleanly to your description or dedicated column if it exists
    const integratedDescriptionText = `[Service: ${form.service}]${form.vin ? ` [VIN: ${form.vin}]` : ''} — ${form.description || 'No description provided.'}`

    if (!workshopId) {
      setError('Could not determine your mechanic. Please use the workshop link.')
      toast.error('Quote submission failed. Please try again.')
      setLoading(false)
      return
    }

    const { data, error: supabaseError } = await (supabase as any).from('quotes').insert({
      workshop_id: workshopId,
      customer_name: sanitizeText(form.customerName, 200),
      customer_email: sanitizeEmail(form.customerEmail) || null,
      customer_phone: sanitizePhone(form.customerPhone),
      vehicle_make: sanitizeText(form.brand, 100),
      vehicle_model: sanitizeText(form.model, 100),
      vehicle_year: form.year ? parseInt(form.year) : null,
      description: sanitizeText(integratedDescriptionText, 2000),
      status: 'pending',
    }).select('id, quote_token').single()

    setLoading(false)

    if (supabaseError) {
      const msg = supabaseError.code === '42501'
        ? 'You do not have permission to submit a quote. Please sign in.'
        : supabaseError.code === '23502'
          ? 'A required field is missing. Please check your details.'
          : 'Could not save your request. Please try again.'
      setError(msg)
      toast.error(msg)
      console.error(supabaseError)
      return
    }

    toast.success('Quote submitted successfully!')

    // 🌟 If user is unauthenticated, store the quote ID and token locally for later mapping
    if (isAnonymous && data?.id) {
      localStorage.setItem('pending_quote_id', data.id)
      if (data.quote_token) {
        localStorage.setItem('pending_quote_token', data.quote_token)
      }
    }

    setSubmitted(true)
    window.open(`https://wa.me/${config.whatsappNumber}?text=${buildWhatsAppMessage()}`, '_blank')
  }

  if (submitted) {
    return (
      <div className="bg-white border border-green-200 rounded-base shadow-sm p-6 flex flex-col items-center gap-4 text-center">
        <MessageCircle className="h-10 w-10 text-success" />
        <h3 className="text-lg font-bold text-grey-dark">WhatsApp is opening!</h3>
        <p className="text-xs text-grey max-w-sm leading-relaxed">
          Your quote details are pre-filled. Just hit send in WhatsApp to finalize your booking request.
        </p>

        {isAnonymous && (
          <div className="mt-4 p-4 bg-white border border-grey-medium/10 rounded-base flex flex-col gap-3 max-w-md w-full shadow-sm">
            <p className="text-xs font-semibold text-grey-dark">
              💡 Track this repair dashboard live!
            </p>
            <p className="text-[11px] text-grey leading-normal">
              Create an account using the same phone number, and we will link this quote to your personal garage workspace automatically.
            </p>
            <Link href="/signup" className="w-full bg-primary text-white text-xs font-bold py-2 px-4 rounded-base no-underline hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <UserPlus size={14} />
              <span>Create Free Account</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        <Button variant="secondary" onClick={() => setSubmitted(false)} className="text-xs mt-2 font-semibold">
          Submit another quote
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h3 className="text-lg font-bold text-grey-dark border-b border-grey-light pb-2">Your details</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Full Name</label>
          <input
            name="customerName"
            type="text"
            placeholder="John Doe"
            required
            value={form.customerName}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">WhatsApp Number</label>
          <input
            name="customerPhone"
            type="tel"
            placeholder="+27 82 000 0000"
            required
            value={form.customerPhone}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>
      </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Email</label>
          <input
            name="customerEmail"
            type="email"
            placeholder="you@example.com"
            required
            value={form.customerEmail}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>

      <h3 className="text-lg font-bold text-grey-dark border-b border-grey-light pb-2 pt-2">Vehicle details</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Car Brand</label>
          <input
            name="brand"
            type="text"
            placeholder="BMW"
            required
            value={form.brand}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Model</label>
          <input
            name="model"
            type="text"
            placeholder="M4"
            required
            value={form.model}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Year</label>
          <input
            name="year"
            type="number"
            placeholder="2024"
            required
            min="1990"
            max="2027"
            value={form.year}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
          />
        </div>

        {/* 🌟 New VIN Field added cleanly */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">VIN Number (Optional)</label>
          <input
            name="vin"
            type="text"
            placeholder="17-CHARACTER VIN"
            value={form.vin}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-grey uppercase tracking-wide">Service Required</label>
        <select
          name="service"
          required
          value={form.service}
          onChange={handleChange}
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark h-[40px]"
        >
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-grey uppercase tracking-wide">Describe the Problem</label>
        <textarea
          name="description"
          placeholder="Describe the issue with your car..."
          rows={4}
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-error font-semibold tracking-wide bg-error/5 p-3 rounded-base border border-error/10">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-base shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
        <span>{loading ? 'Processing Estimate...' : 'Request Quote via WhatsApp'}</span>
      </Button>
    </form>
  )
}