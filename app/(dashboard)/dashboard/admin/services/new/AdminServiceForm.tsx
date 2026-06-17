'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type ServiceRow = Database['public']['Tables']['services']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

interface AdminServiceFormProps {
  service?: ServiceRow
  categories: CategoryRow[]
}

export default function AdminServiceForm({ service, categories }: AdminServiceFormProps) {
  const router = useRouter()
  const isEditing = !!service

  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    category_id: service?.category_id ?? '',
    category: service?.category ?? '',
    base_price: service?.base_price?.toString() ?? '',
    is_active: service?.is_active ?? true,
    image_url: service?.image_url ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      category: form.category || null,
      base_price: form.base_price ? parseFloat(form.base_price) : null,
      is_active: form.is_active,
      image_url: form.image_url.trim() || null,
    }

    if (isEditing && service) {
      const { error: updateError } = await (supabase as any)
        .from('services')
        .update(payload)
        .eq('id', service.id)

      if (updateError) {
        setError(updateError.message)
        toast.error(updateError.message)
        setLoading(false)
        return
      }
      toast.success('Service updated successfully!')
    } else {
      const { error: insertError } = await (supabase as any)
        .from('services')
        .insert({
          ...payload,
          user_id: (await supabase.auth.getUser()).data.user?.id ?? '',
        })

      if (insertError) {
        setError(insertError.message)
        toast.error(insertError.message)
        setLoading(false)
        return
      }
      toast.success('Service created successfully!')
    }

    setLoading(false)
    router.push('/dashboard/admin/services')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-grey uppercase tracking-wide">Service Name *</label>
        <input
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Full Engine Service"
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm text-grey-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-grey uppercase tracking-wide">Description</label>
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          placeholder="Describe what this service includes..."
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm text-grey-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm text-grey-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors h-[40px]"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-grey uppercase tracking-wide">Base Price (ZAR)</label>
          <input
            name="base_price"
            type="number"
            step="0.01"
            min="0"
            value={form.base_price}
            onChange={handleChange}
            placeholder="e.g. 1500.00"
            className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm text-grey-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-grey uppercase tracking-wide">Image URL</label>
        <input
          name="image_url"
          type="url"
          value={form.image_url}
          onChange={handleChange}
          placeholder="https://example.com/image.webp"
          className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm text-grey-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
        />
      </div>

      <div className="flex items-center justify-between py-3 px-4 bg-grey-lightest rounded-base border border-grey-medium/10">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-grey-dark">Active</span>
          <span className="text-xs text-grey">Inactive services are hidden from customers</span>
        </div>
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
          className="text-primary"
        >
          {form.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-error font-semibold tracking-wide bg-error/5 p-3 rounded-base border border-error/10">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/dashboard/admin/services"
          className="inline-flex items-center gap-1.5 border border-grey-medium text-grey px-4 py-2.5 rounded-base text-sm font-semibold no-underline hover:bg-grey-lightest transition-colors"
        >
          <ArrowLeft size={14} />
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          <Save size={14} />
          {loading ? 'Saving...' : isEditing ? 'Update Service' : 'Create Service'}
        </button>
      </div>
    </form>
  )
}