
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

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

// The mechanic's user_id — set this in .env as NEXT_PUBLIC_MECHANIC_USER_ID
// This is the Supabase auth uid of the admin/mechanic account
const MECHANIC_USER_ID = process.env.NEXT_PUBLIC_MECHANIC_USER_ID ?? ''

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    brand: '',
    model: '',
    year: '',
    service: SERVICE_OPTIONS[0],
    description: '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function buildWhatsAppMessage() {
    return encodeURIComponent(
      [
        `🔧 *Quote Request — Autofield Technics*`,
        ``,
        `👤 *Name:* ${form.customerName}`,
        `📞 *Phone:* ${form.customerPhone}`,
        `🚗 *Vehicle:* ${form.brand} ${form.model} (${form.year})`,
        `🛠️ *Service:* ${form.service}`,
        ``,
        `📝 *Description:*`,
        form.description || 'No description provided.',
      ].join('\n')
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Save to Supabase using correct column names from database.ts
   const { error: supabaseError } = await (supabase.from('quotes') as any).insert({
      user_id: MECHANIC_USER_ID,
      customer_name: form.customerName,
      customer_phone: form.customerPhone,
      vehicle_make: form.brand,
      vehicle_model: form.model,
      vehicle_year: form.year ? parseInt(form.year) : null,
      service_type: form.service,
      description: form.description || 'No description provided.',
      status: 'pending',
    })

    setLoading(false)

    if (supabaseError) {
      setError('Could not save your request. Please try again.')
      console.error(supabaseError)
      return
    }

    // Open WhatsApp with pre-filled message
    setSubmitted(true)
    window.open(`https://wa.me/${WA_NUMBER}?text=${buildWhatsAppMessage()}`, '_blank')
  }

  if (submitted) {
    return (
      <div className="card text-center py-10 flex flex-col items-center gap-4">
        <p className="text-4xl">💬</p>
        <h3 className="text-lg font-semibold text-black">WhatsApp is opening!</h3>
        <p className="text-small text-grey max-w-xs">
          Your quote details are pre-filled. Just hit send and we will get back
          to you within 30 minutes.
        </p>
        <Button variant="secondary" onClick={() => setSubmitted(false)}>
          Submit another quote
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5">

      <h3 className="text-lg font-bold text-black">Your details</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-grey">Full Name</label>
          <input
            name="customerName"
            type="text"
            placeholder="John Doe"
            required
            value={form.customerName}
            onChange={handleChange}
            className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-grey">WhatsApp Number</label>
          <input
            name="customerPhone"
            type="tel"
            placeholder="+27 82 000 0000"
            required
            value={form.customerPhone}
            onChange={handleChange}
            className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <h3 className="text-lg font-bold text-black pt-1">Vehicle details</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-grey">Car Brand</label>
          <input
            name="brand"
            type="text"
            placeholder="BMW"
            required
            value={form.brand}
            onChange={handleChange}
            className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-grey">Model</label>
          <input
            name="model"
            type="text"
            placeholder="M4"
            required
            value={form.model}
            onChange={handleChange}
            className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">Year</label>
        <input
          name="year"
          type="number"
          placeholder="2024"
          required
          min="1990"
          max="2025"
          value={form.year}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">Service Required</label>
        <select
          name="service"
          required
          value={form.service}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors bg-white"
        >
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">Describe the Problem</label>
        <textarea
          name="description"
          placeholder="Describe the issue with your car..."
          rows={4}
          value={form.description}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? 'Saving...' : 'Request Quote via WhatsApp 💬'}
      </Button>

    <p className="text-xs text-grey-medium text-center">
        Your details are saved and WhatsApp will open with your request pre-filled.
      </p>

    </form>
  )
}
