'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Loader2, User, Mail, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSending(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send message. Please try again.')
        setSending(false)
        return
      }

      setSent(true)
      setForm({ name: '', email: '', phone: '', message: '' })
      toast.success(data.message || 'Message sent! We will get back to you soon.')
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <Send size={28} />
        </div>
        <h3 className="text-lg font-bold text-grey-dark">Message Sent!</h3>
        <p className="text-sm text-grey max-w-sm">Thank you for reaching out. We will review your message and get back to you within 30 minutes during business hours.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm text-primary font-semibold hover:underline mt-2"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <User size={12} />
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="Your full name"
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
            <Phone size={12} />
            Phone *
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
            placeholder="e.g. 078 480 2796"
            className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
          <Mail size={12} />
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="your@email.com (optional)"
          className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
          <MessageSquare size={12} />
          Message *
        </label>
        <textarea
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          required
          placeholder="Tell us about your vehicle and what service you need..."
          rows={5}
          className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={sending}
          aria-disabled={sending}
          aria-busy={sending}
          className="bg-primary text-white font-bold py-2.5 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>{sending ? 'Sending...' : 'Send Message'}</span>
        </Button>
      </div>
    </form>
  )
}
