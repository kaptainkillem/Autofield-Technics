'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Globe, ArrowLeft, Plus, Loader2, Edit3, MapPin, Layers, Layout, X, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TableSearch } from '@/components/ui/TableSearch'

type SEORecord = {
  id: string
  path_url: string
  page_type: string
  meta_title: string
  meta_description: string
  meta_keywords: string | null
  h1_heading: string | null
  province?: string | null
  city?: string | null
  suburb?: string | null
  is_active: boolean | null
}

const SYSTEM_CORE_ROUTES = [
  { path: '/', title: 'Home Page' },
  { path: '/quote', title: 'Get a Repair Quote' },
  { path: '/signin', title: 'Account Sign In' },
  { path: '/signup', title: 'Create Free Account' },
  { path: '/terms', title: 'Terms of Service' },
  { path: '/privacy', title: 'Privacy Policy' },
]

export default function AdminSEOCommandPage() {
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)

  const [records, setRecords] = useState<SEORecord[]>([])
  const [viewTab, setViewTab] = useState<'all' | 'static_core' | 'geographic_node'>('all')
  const [search, setSearch] = useState('')

  const [editingRecord, setEditingRecord] = useState<SEORecord | null>(null)
  const [showGeoForm, setShowGeoForm] = useState(false)

  const [geoForm, setGeoForm] = useState({
    province: 'Gauteng', city: '', suburb: '', title: '', desc: '', keywords: '', h1: ''
  })

  async function fetchSEORegistry() {
    const { data } = await supabase
      .from('seo_registry')
      .select('*')
      .order('path_url', { ascending: true })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSEORegistry()
  }, [])

  async function handleDiscoverPages() {
    setScanning(true)

    for (const route of SYSTEM_CORE_ROUTES) {
      const existing = records.find(r => r.path_url === route.path)
      if (!existing) {
        await (supabase as any).from('seo_registry').insert({
          path_url: route.path,
          page_type: 'static_core',
          meta_title: `${route.title} | Autofield Technics`,
          meta_description: `Professional mobile mechanics and premium workshop services parameters for ${route.title}.`,
          meta_keywords: 'mechanic, mobile car service, auto repair',
          h1_heading: route.title,
        })
      }
    }

    await fetchSEORegistry()
    setScanning(false)
  }

  async function handleUpdateMetadata(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRecord) return
    setSaving(true)

    const { error } = await (supabase as any)
      .from('seo_registry')
      .update({
        meta_title: editingRecord.meta_title.trim(),
        meta_description: editingRecord.meta_description.trim(),
        meta_keywords: editingRecord.meta_keywords?.trim() ?? '',
        h1_heading: editingRecord.h1_heading?.trim() ?? '',
        updated_at: new Date().toISOString()
      })
      .eq('id', editingRecord.id)

    setSaving(false)
    if (!error) {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? editingRecord : r))
      setEditingRecord(null)
    }
  }

  async function handleCreateGeoNode(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const provSlug = geoForm.province.toLowerCase().replace(/\s+/g, '-')
    const citySlug = geoForm.city.toLowerCase().replace(/\s+/g, '-')
    const suburbSlug = geoForm.suburb.toLowerCase().replace(/\s+/g, '-')
    const fullPathUrl = `/${provSlug}/${citySlug}/${suburbSlug}`

    const { data, error } = await (supabase as any)
      .from('seo_registry')
      .insert({
        path_url: fullPathUrl,
        page_type: 'geographic_node',
        meta_title: geoForm.title.trim(),
        meta_description: geoForm.desc.trim(),
        meta_keywords: geoForm.keywords.trim(),
        h1_heading: geoForm.h1.trim(),
        province: geoForm.province,
        city: geoForm.city.trim(),
        suburb: geoForm.suburb.trim()
      })
      .select('*')
      .single()

    setSaving(false)
    if (!error && data) {
      setRecords(prev => [data, ...prev])
      setShowGeoForm(false)
      setGeoForm({ province: 'Gauteng', city: '', suburb: '', title: '', desc: '', keywords: '', h1: '' })
    }
  }

  const visibleRecords = records.filter(r => {
    const matchTab = viewTab === 'all' || r.page_type === viewTab
    const term = search.toLowerCase()
    const matchSearch = r.path_url.toLowerCase().includes(term) || r.meta_title.toLowerCase().includes(term)
    return matchTab && matchSearch
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Globe className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm max-w-[1600px] mx-auto w-full mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-grey-light pb-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin" className="p-2 rounded-base border border-grey-medium/10 bg-white text-grey hover:text-primary hover:bg-primary/5 transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">Global SEO Control Deck</h1>
            <p className="text-sm text-grey">Discover core page routes or generate geographic landing channels from one portal view.</p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={handleDiscoverPages} disabled={scanning} className="border-grey-medium text-grey font-bold text-xs flex items-center gap-1.5 h-9 bg-white hover:bg-primary/5">
            {scanning ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />}
            <span>Sync Core App Pages</span>
          </Button>
          <Button size="sm" onClick={() => setShowGeoForm(!showGeoForm)} className="bg-primary text-white font-bold text-xs flex items-center gap-1.5 h-9 shadow-sm hover:bg-primary-dark">
            <Plus size={14} />
            <span>Deploy Area Node</span>
          </Button>
        </div>
      </div>

      {/* Deploy Area Node Form */}
      {showGeoForm && (
        <form onSubmit={handleCreateGeoNode} className="bg-white border border-primary/20 rounded-base p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <h3 className="col-span-full text-xs font-black uppercase text-primary tracking-wider border-b border-grey-light pb-2">Geographic Area Meta Setup</h3>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-grey uppercase">Province</label>
            <select value={geoForm.province} onChange={(e) => setGeoForm(p=>({...p, province: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm h-[38px] text-grey-dark focus:ring-2 focus:ring-primary/10 bg-white">
              <option value="Gauteng">Gauteng</option>
              <option value="Western Cape">Western Cape</option>
              <option value="KwaZulu-Natal">KwaZulu-Natal</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-grey uppercase">City / Town</label>
            <input type="text" required placeholder="e.g. Cape Town" value={geoForm.city} onChange={(e)=>setGeoForm(p=>({...p, city: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-grey uppercase">Suburb / Area</label>
            <input type="text" required placeholder="e.g. Claremont" value={geoForm.suburb} onChange={(e)=>setGeoForm(p=>({...p, suburb: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-bold text-grey uppercase">SEO Meta Title</label>
            <input type="text" required placeholder="Mobile Mechanic in Claremont | Best Rates" value={geoForm.title} onChange={(e)=>setGeoForm(p=>({...p, title: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-grey uppercase">H1 Main Heading</label>
            <input type="text" required placeholder="Professional Mobile Mechanics in Claremont" value={geoForm.h1} onChange={(e)=>setGeoForm(p=>({...p, h1: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-xs font-bold text-grey uppercase">Keywords (Comma Separated)</label>
            <input type="text" placeholder="mechanic claremont, mobile car repair, clutch fix" value={geoForm.keywords} onChange={(e)=>setGeoForm(p=>({...p, keywords: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-xs font-bold text-grey uppercase">SEO Meta Description</label>
            <textarea required rows={2} placeholder="Need elite automotive assistance on-site in Claremont? Our mechanics come straight to you..." value={geoForm.desc} onChange={(e)=>setGeoForm(p=>({...p, desc: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark resize-none" />
          </div>
          <div className="col-span-full flex justify-end gap-2 border-t border-grey-light pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowGeoForm(false)} className="text-grey text-xs">Cancel</Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-primary text-white font-bold text-xs px-4 flex items-center gap-1 shadow-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Deploy Dynamic Path</span>
            </Button>
          </div>
        </form>
      )}

      {/* Filters + Table */}
      <div className="flex flex-col gap-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-xs">
            <TableSearch
              placeholder="Search by route or title..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <div className="flex gap-1 border border-grey-medium/20 rounded-base p-1 bg-white shrink-0">
            {([
              { id: 'all', label: 'All Pages', icon: Globe },
              { id: 'static_core', label: 'App Routes', icon: Layout },
              { id: 'geographic_node', label: 'Geo Areas', icon: MapPin },
            ] as const).map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setViewTab(tab.id)} className={`px-3 py-1.5 rounded-base text-xs font-bold flex items-center gap-1.5 transition-all ${viewTab === tab.id ? 'bg-primary/10 text-primary shadow-sm' : 'text-grey hover:text-grey-dark hover:bg-primary/5'}`}>
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div className="border border-grey-medium/10 rounded-base overflow-hidden">
          <div className="p-4 border-b border-grey-medium/20 bg-white flex items-center justify-between">
            <span className="text-sm font-semibold text-grey-dark">All SEO pages</span>
            <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
              {visibleRecords.length} shown
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs">
                  <th className="py-3 px-4 font-bold">Target Address Path</th>
                  <th className="py-3 px-4 font-bold">Classification</th>
                  <th className="py-3 px-4 font-bold hidden md:table-cell">Meta Header Title</th>
                  <th className="py-3 px-4 font-bold text-right">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-light">
                {visibleRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-grey text-sm">
                      No directory tracking indexes established. Click &quot;Sync Core App Pages&quot; to initialize.
                    </td>
                  </tr>
                ) : (
                  visibleRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-primary/5 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-grey-dark font-semibold">
                        {record.path_url}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${record.page_type === 'static_core' ? 'bg-primary/10 text-primary' : 'bg-green-50 text-green-700'}`}>
                          {record.page_type === 'static_core' ? 'App Route' : 'Geo Area'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-grey max-w-xs truncate hidden md:table-cell font-medium">
                        {record.meta_title}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingRecord(record)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors"
                        >
                          <Edit3 size={11} />
                          <span>Configure</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-grey-medium/20 rounded-base shadow-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-grey-light bg-white">
              <div className="flex flex-col">
                <h2 className="text-base font-black text-grey-dark">Edit SEO Configuration</h2>
                <span className="text-xs font-mono text-primary font-semibold">{editingRecord.path_url}</span>
              </div>
              <button onClick={() => setEditingRecord(null)} className="p-2 rounded-base text-grey hover:text-primary hover:bg-primary/5 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateMetadata} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-grey uppercase tracking-wide">Meta Title Header</label>
                <input type="text" required value={editingRecord.meta_title} onChange={(e)=>setEditingRecord(p => p ? ({...p, meta_title: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark focus:ring-2 focus:ring-primary/10" />
                <span className="text-[10px] text-grey-medium text-right font-medium">{editingRecord.meta_title.length}/60 recommended chars</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-grey uppercase tracking-wide">H1 Viewport Main Heading</label>
                <input type="text" required value={editingRecord.h1_heading ?? ''} onChange={(e)=>setEditingRecord(p => p ? ({...p, h1_heading: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-grey uppercase tracking-wide">Focus Meta Keywords (Comma Separated)</label>
                <input type="text" placeholder="brake service, mechanic near me, cheap car repair" value={editingRecord.meta_keywords ?? ''} onChange={(e)=>setEditingRecord(p => p ? ({...p, meta_keywords: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-grey uppercase tracking-wide">Meta Snippet Description</label>
                <textarea required rows={4} value={editingRecord.meta_description} onChange={(e)=>setEditingRecord(p => p ? ({...p, meta_description: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark resize-none" />
                <span className="text-[10px] text-grey-medium text-right font-medium">{editingRecord.meta_description.length}/160 recommended chars</span>
              </div>

              <div className="flex justify-end gap-2 border-t border-grey-light pt-4 mt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRecord(null)} className="text-grey text-xs">Cancel Changes</Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-primary text-white font-bold text-xs px-4 flex items-center gap-1.5 shadow-sm">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{saving ? 'Syncing Schema...' : 'Save Meta Parameters'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
