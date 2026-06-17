'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Loader2, ArrowRight, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { SITE_CONFIG, replaceVars } from '@/lib/site-config'
import { Database } from '@/types/database'
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

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '27000000000'
const MECHANIC_USER_ID = process.env.NEXT_PUBLIC_MECHANIC_USER_ID || null

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
        setIsAnonymous(false)
      }
    })
  }, [])

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    brand: '',
    model: '',
    year: '',
    vin: '', // 🌟 Added VIN field state
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
        `🔧 *${SITE_CONFIG.quotes.whatsAppPrefix} — ${SITE_CONFIG.name}*`,
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

    const { data, error: supabaseError } = await (supabase as any).from('quotes').insert({
      user_id: currentUserId || null,
      customer_name: form.customerName,
      customer_phone: form.customerPhone,
      customer_email: null,
      vehicle_make: form.brand,
      vehicle_model: form.model,
      vehicle_year: form.year ? parseInt(form.year) : null,
      description: integratedDescriptionText, 
      status: 'pending',
    }).select('id').single()

    setLoading(false)

    if (supabaseError) {
      setError('Could not save your request. Please try again.')
      toast.error('Quote submission failed. Please try again.')
      console.error(supabaseError)
      return
    }

    toast.success('Quote submitted successfully!')

    // 🌟 If user is unauthenticated, store the quote ID locally for later mapping
    if (isAnonymous && data?.id) {
      localStorage.setItem('pending_quote_id', data.id)
    }

    setSubmitted(true)
    window.open(`https://wa.me/${WA_NUMBER}?text=${buildWhatsAppMessage()}`, '_blank')
  }

  if (submitted) {
    return (
      <div className="card text-center py-10 flex flex-col items-center gap-4 bg-green-50/50 border border-green-200 rounded-base p-6 shadow-sm">
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