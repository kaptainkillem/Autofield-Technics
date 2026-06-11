'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

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

const WHATSAPP_NUMBER = '27000000000' // TODO: replace with real number in .env

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    brand: '',
    model: '',
    year: '',
    service: SERVICE_OPTIONS[0],
    description: '',
    image: null as File | null,
    video: null as File | null,
  })

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, [e.target.name]: file }))
  }

  function buildWhatsAppMessage() {
    const lines = [
      `🔧 *Quote Request — Autofield Technics*`,
      ``,
      `🚗 *Vehicle:* ${form.brand} ${form.model} (${form.year})`,
      `🛠️ *Service:* ${form.service}`,
      ``,
      `📝 *Description:*`,
      form.description || 'No description provided.',
    ]
    return encodeURIComponent(lines.join('\n'))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const message = buildWhatsAppMessage()
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      '_blank'
    )
  }

  if (submitted) {
    return (
      <div className="card text-center py-10 flex flex-col items-center gap-4">
        <p className="text-4xl">💬</p>
        <h3 className="text-lg font-semibold text-black">
          WhatsApp is opening!
        </h3>
        <p className="text-small text-grey max-w-xs">
          Your quote details are pre-filled. Just hit send and we will get
          back to you within 30 minutes.
        </p>
        <Button
          variant="secondary"
          onClick={() => setSubmitted(false)}
        >
          Submit another quote
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5">

      <h3 className="text-lg font-bold text-black">Vehicle details</h3>

      {/* Brand + Model side by side */}
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

      {/* Year */}
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

      {/* Service */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">
          Service Required
        </label>
        <select
          name="service"
          required
          value={form.service}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors bg-white"
        >
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">
          Describe the Problem
        </label>
        <textarea
          name="description"
          placeholder="Describe the issue with your car..."
          rows={4}
          value={form.description}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* File uploads */}
      <div className="flex flex-col gap-4 border-t border-grey-medium/30 pt-4">
        <p className="text-sm font-semibold text-grey">
          Attach media (optional)
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-grey">Image of damage</label>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="text-sm text-grey file:mr-3 file:py-1.5 file:px-3 file:rounded-base file:border file:border-grey-medium file:text-xs file:font-semibold file:text-grey file:bg-grey-lightest file:cursor-pointer hover:file:border-primary hover:file:text-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-grey">Video of damage</label>
          <input
            name="video"
            type="file"
            accept="video/*"
            onChange={handleFile}
            className="text-sm text-grey file:mr-3 file:py-1.5 file:px-3 file:rounded-base file:border file:border-grey-medium file:text-xs file:font-semibold file:text-grey file:bg-grey-lightest file:cursor-pointer hover:file:border-primary hover:file:text-primary transition-colors"
          />
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" variant="primary" className="w-full justify-center">
        Request Quote via WhatsApp 💬
      </Button>

      <p className="text-xs text-grey-medium text-center">
        Tapping the button will open WhatsApp with your details pre-filled.
      </p>

    </form>
  )
}