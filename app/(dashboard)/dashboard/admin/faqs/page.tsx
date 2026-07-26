'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  HelpCircle, Plus, Loader2, Pencil, Trash2, Save, X, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  display_order: number
  is_active: boolean
  created_at: string
}

const CATEGORIES = ['general', 'booking', 'payments', 'services', 'warranty']

export default function AdminFAQsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    display_order: 0,
    is_active: true,
  })

  const fetchFAQs = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const workshopId = (() => {
      try {
        const payload = JSON.parse(atob(session!.access_token.split('.')[1]))
        return payload?.app_metadata?.workshop_id as string
      } catch { return '' }
    })()
    const { data } = await (supabase as any)
      .from('faqs')
      .select('*')
      .eq('workshop_id', workshopId)
      .order('display_order', { ascending: true })

    setFaqs(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFAQs()
  }, [fetchFAQs])

  function startEdit(faq: FAQ) {
    setEditingId(faq.id)
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      display_order: faq.display_order,
      is_active: faq.is_active,
    })
  }

  function startNew() {
    setEditingId('new')
    setForm({ question: '', answer: '', category: 'general', display_order: faqs.length + 1, is_active: true })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ question: '', answer: '', category: 'general', display_order: 0, is_active: true })
  }

  async function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Question and answer are required')
      return
    }

    setSavingId(editingId)

    const { data: { session } } = await supabase.auth.getSession()
    const workshopId = (() => {
      try {
        const payload = JSON.parse(atob(session!.access_token.split('.')[1]))
        return payload?.app_metadata?.workshop_id as string
      } catch { return '' }
    })()

    const payload = {
      workshop_id: workshopId,
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      display_order: form.display_order,
      is_active: form.is_active,
    }

    let error
    if (editingId === 'new') {
      const { error: insertError } = await (supabase as any).from('faqs').insert(payload)
      error = insertError
    } else {
      const { error: updateError } = await (supabase as any).from('faqs').update(payload).eq('id', editingId)
      error = updateError
    }

    setSavingId(null)

    if (error) {
      toast.error('Failed to save FAQ')
      return
    }

    toast.success(editingId === 'new' ? 'FAQ created!' : 'FAQ updated!')
    setEditingId(null)
    fetchFAQs()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this FAQ?')) return
    setDeletingId(id)
    const { error } = await (supabase as any).from('faqs').delete().eq('id', id)
    setDeletingId(null)

    if (error) {
      toast.error('Failed to delete FAQ')
      return
    }

    toast.success('FAQ deleted')
    fetchFAQs()
  }

  async function toggleActive(faq: FAQ) {
    const { error } = await (supabase as any)
      .from('faqs')
      .update({ is_active: !faq.is_active })
      .eq('id', faq.id)

    if (error) {
      toast.error('Failed to update')
      return
    }

    toast.success(faq.is_active ? 'FAQ hidden from public' : 'FAQ published')
    fetchFAQs()
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="max-w-[1000px] gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-grey-dark tracking-tight">FAQ Manager</h1>
            <p className="text-xs text-grey">Create, edit, and publish FAQs for your customers.</p>
          </div>
        </div>
        <Button
          onClick={startNew}
          className="bg-primary text-white font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={16} />
          New FAQ
        </Button>
      </div>

      {/* New / Edit Form */}
      {editingId && (
        <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-grey-dark">
              {editingId === 'new' ? 'Create New FAQ' : 'Edit FAQ'}
            </h3>
            <button onClick={cancelEdit} className="p-2 rounded-base text-grey hover:bg-primary/5 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Question</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              placeholder="e.g. What areas do you service?"
              className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
              placeholder="Write the full answer here..."
              rows={4}
              className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark h-[40px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-grey uppercase tracking-wide">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="faq-active"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-grey-medium text-primary focus:ring-primary"
            />
            <label htmlFor="faq-active" className="text-sm text-grey-dark font-medium">Published (visible to public)</label>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={cancelEdit} className="px-4 py-2.5 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer">
              Cancel
            </button>
            <Button
              onClick={handleSave}
              disabled={savingId === editingId}
              className="bg-primary text-white font-bold flex items-center gap-2 shadow-sm"
            >
              {savingId === editingId ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{savingId === editingId ? 'Saving...' : 'Save FAQ'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="flex flex-col gap-3">
        {faqs.length === 0 ? (
          <div className="bg-white border border-grey-medium/10 rounded-base p-12 text-center shadow-sm">
            <HelpCircle className="h-10 w-10 text-grey-medium mx-auto mb-3" />
            <p className="text-grey-dark font-semibold text-sm mb-1">No FAQs yet</p>
            <p className="text-grey text-xs mb-4">Create your first FAQ to help customers find answers.</p>
            <Button onClick={startNew} className="bg-primary text-white font-bold flex items-center gap-1.5 shadow-sm mx-auto">
              <Plus size={14} />
              Create First FAQ
            </Button>
          </div>
        ) : (
          faqs.map((faq) => (
            <div
              key={faq.id}
              className={`bg-white border rounded-base p-5 shadow-sm flex flex-col gap-3 ${faq.is_active ? 'border-grey-medium/10' : 'border-grey-medium/10 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {faq.category}
                    </span>
                    <span className="text-[10px] text-grey-medium">Order #{faq.display_order}</span>
                    {!faq.is_active && (
                      <span className="text-[10px] font-bold bg-grey-light text-grey px-1.5 py-0.5 rounded uppercase">Draft</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-grey-dark">{faq.question}</h4>
                  <p className="text-xs text-grey mt-1 leading-relaxed">{faq.answer}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(faq)}
                    className="p-2 rounded-base text-grey hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    title={faq.is_active ? 'Hide from public' : 'Publish'}
                  >
                    {faq.is_active ? <HelpCircle size={16} /> : <HelpCircle size={16} className="text-grey-medium" />}
                  </button>
                  <button
                    onClick={() => startEdit(faq)}
                    className="p-2 rounded-base text-grey hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    disabled={deletingId === faq.id}
                    className="p-2 rounded-base text-grey hover:text-error hover:bg-error/5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === faq.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageWrapper>
  )
}
