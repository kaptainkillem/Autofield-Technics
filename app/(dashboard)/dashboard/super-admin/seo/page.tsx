'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Globe, ArrowLeft, Plus, Loader2, Edit3, MapPin, Layers, Layout, X, Save, ArrowUpDown, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TableSearch } from '@/components/ui/TableSearch'
import { PageWrapper } from '@/components/layout/PageWrapper'

type SEORecord = {
  id: string
  workshop_id: string | null
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
  created_at?: string
}

type Workshop = {
  id: string
  name: string
  slug: string
}

type SortField = 'path_url' | 'page_type' | 'province' | 'created_at'
type SortDir = 'asc' | 'desc'

const SYSTEM_CORE_ROUTES = [
  { path: '/', title: 'Home Page' },
  { path: '/quote', title: 'Get a Repair Quote' },
  { path: '/signin', title: 'Account Sign In' },
  { path: '/signup', title: 'Create Free Account' },
  { path: '/terms', title: 'Terms of Service' },
  { path: '/privacy', title: 'Privacy Policy' },
  { path: '/services', title: 'Services Overview' },
  { path: '/locations', title: 'Location Coverage' },
  { path: '/faq', title: 'Frequently Asked Questions' },
  { path: '/reviews', title: 'Customer Reviews' },
  { path: '/contact', title: 'Contact Us' },
]

const GEO_PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal',
  'Eastern Cape', 'Free State', 'Mpumalanga',
  'Limpopo', 'North West', 'Northern Cape',
]

export default function AdminSEOCommandPage() {
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cloning, setCloning] = useState(false)
  const [cloneDone, setCloneDone] = useState(false)

  const [records, setRecords] = useState<SEORecord[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>('__global__')

  const [viewTab, setViewTab] = useState<'all' | 'static_core' | 'geographic_node'>('all')
  const [search, setSearch] = useState('')
  const [filterProvince, setFilterProvince] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const [sortField, setSortField] = useState<SortField>('path_url')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [editingRecord, setEditingRecord] = useState<SEORecord | null>(null)
  const [showGeoForm, setShowGeoForm] = useState(false)

  const [geoForm, setGeoForm] = useState({
    province: 'Gauteng', city: '', suburb: '', title: '', desc: '', keywords: '', h1: ''
  })

  useEffect(() => {
    async function init() {
      const { data: w } = await supabase.from('workshops').select('id, name, slug').order('name')
      setWorkshops(w || [])
      await fetchSEORegistry()
      setLoading(false)
    }
    init()
  }, [])

  async function fetchSEORegistry() {
    let query = supabase.from('seo_registry').select('*').order('path_url', { ascending: true })
    const { data } = await query
    setRecords(data || [])
  }

  async function handleDiscoverPages() {
    setScanning(true)
    const wsId = selectedWorkshopId === '__global__' ? null : selectedWorkshopId

    for (const route of SYSTEM_CORE_ROUTES) {
      const existing = records.find(r =>
        r.path_url === route.path &&
        r.workshop_id === wsId
      )
      if (!existing) {
        await (supabase as any).from('seo_registry').insert({
          workshop_id: wsId,
          path_url: route.path,
          page_type: 'static_core',
          meta_title: `${route.title} | Autofield Technics`,
          meta_description: `Professional mobile mechanics and premium workshop services for ${route.title}.`,
          meta_keywords: 'mechanic, mobile car service, auto repair',
          h1_heading: route.title,
        })
      }
    }
    await fetchSEORegistry()
    setScanning(false)
  }

  async function handleCloneFromGlobal() {
    if (selectedWorkshopId === '__global__') return
    setCloning(true)
    setCloneDone(false)

    const { data: globalRecords } = await supabase
      .from('seo_registry')
      .select('path_url, page_type, meta_title, meta_description, meta_keywords, h1_heading, province, city, suburb')
      .is('workshop_id', null)

    if (globalRecords && globalRecords.length > 0) {
      const toInsert = globalRecords.map(r => ({
        workshop_id: selectedWorkshopId,
        path_url: r.path_url,
        page_type: r.page_type,
        meta_title: r.meta_title,
        meta_description: r.meta_description,
        meta_keywords: r.meta_keywords,
        h1_heading: r.h1_heading,
        province: r.province,
        city: r.city,
        suburb: r.suburb,
      }))
      await (supabase as any).from('seo_registry').insert(toInsert)
    }

    await fetchSEORegistry()
    setCloning(false)
    setCloneDone(true)
    setTimeout(() => setCloneDone(false), 2000)
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

  async function handleToggleActive(record: SEORecord) {
    const newState = !record.is_active
    const { error } = await (supabase as any)
      .from('seo_registry')
      .update({ is_active: newState, updated_at: new Date().toISOString() })
      .eq('id', record.id)

    if (!error) {
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, is_active: newState } : r))
    }
  }

  async function handleCreateGeoNode(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const provSlug = geoForm.province.toLowerCase().replace(/\s+/g, '-')
    const citySlug = geoForm.city.toLowerCase().replace(/\s+/g, '-')
    const suburbSlug = geoForm.suburb.toLowerCase().replace(/\s+/g, '-')
    const fullPathUrl = `/${provSlug}/${citySlug}/${suburbSlug}`
    const wsId = selectedWorkshopId === '__global__' ? null : selectedWorkshopId

    const { data, error } = await (supabase as any)
      .from('seo_registry')
      .insert({
        workshop_id: wsId,
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

  const filteredRecords = useMemo(() => {
    let result = records

    if (selectedWorkshopId === '__global__') {
      result = result.filter(r => r.workshop_id === null)
    } else {
      result = result.filter(r => r.workshop_id === selectedWorkshopId)
    }

    if (viewTab !== 'all') {
      result = result.filter(r => r.page_type === viewTab)
    }

    if (filterActive === 'active') {
      result = result.filter(r => r.is_active === true)
    } else if (filterActive === 'inactive') {
      result = result.filter(r => r.is_active === false)
    }

    if (filterProvince) {
      result = result.filter(r => r.province === filterProvince)
    }

    const term = search.toLowerCase().trim()
    if (term) {
      result = result.filter(r =>
        r.path_url.toLowerCase().includes(term) ||
        r.meta_title.toLowerCase().includes(term) ||
        (r.city?.toLowerCase() ?? '').includes(term) ||
        (r.suburb?.toLowerCase() ?? '').includes(term)
      )
    }

    result.sort((a, b) => {
      let cmp = 0
      const aVal = a[sortField] ?? ''
      const bVal = b[sortField] ?? ''
      if (sortField === 'created_at') {
        cmp = String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
      } else {
        cmp = String(aVal).localeCompare(String(bVal))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [records, selectedWorkshopId, viewTab, filterActive, filterProvince, search, sortField, sortDir])

  const selectedWorkshopLabel = selectedWorkshopId === '__global__'
    ? 'Global Defaults'
    : workshops.find(w => w.id === selectedWorkshopId)?.name ?? 'Unknown'

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Globe className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-grey-light pb-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/super-admin" className="p-2 rounded-base border border-grey-medium/10 bg-white text-grey hover:text-primary hover:bg-primary/5 transition-all">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-grey-dark">SEO Control Deck</h1>
              <p className="text-sm text-grey">Manage global defaults or per-workshop SEO overrides for app routes and geographic pages.</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={handleDiscoverPages} disabled={scanning} className="border-grey-medium text-grey font-bold text-xs flex items-center gap-1.5 h-9 bg-white hover:bg-primary/5">
              {scanning ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />}
              <span>Sync Core Routes</span>
            </Button>
            {selectedWorkshopId !== '__global__' && (
              <Button size="sm" variant="outline" onClick={handleCloneFromGlobal} disabled={cloning || cloneDone} className="border-grey-medium text-grey font-bold text-xs flex items-center gap-1.5 h-9 bg-white hover:bg-primary/5">
                {cloning ? <Loader2 size={13} className="animate-spin" /> : cloneDone ? <Check size={13} /> : <Copy size={13} />}
                <span>{cloneDone ? 'Cloned' : 'Clone from Global'}</span>
              </Button>
            )}
            <Button size="sm" onClick={() => setShowGeoForm(!showGeoForm)} className="bg-primary text-white font-bold text-xs flex items-center gap-1.5 h-9 shadow-sm hover:bg-primary-dark">
              <Plus size={14} />
              <span>Deploy Area Node</span>
            </Button>
          </div>
        </div>

        {/* Workshop Selector */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Workshop</label>
            <select
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
              className="rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark focus:ring-2 focus:ring-primary/10 bg-white min-w-[200px]"
            >
              <option value="__global__">Global Defaults (NULL)</option>
              {workshops.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.slug})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Province</label>
            <select
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
              className="rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark focus:ring-2 focus:ring-primary/10 bg-white"
            >
              <option value="">All Provinces</option>
              {GEO_PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-grey uppercase tracking-wide">Status</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
              className="rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark focus:ring-2 focus:ring-primary/10 bg-white"
            >
              <option value="all">All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Deploy Area Node Form */}
        {showGeoForm && (
          <form onSubmit={handleCreateGeoNode} className="bg-white border border-primary/20 rounded-base p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <h3 className="col-span-full text-xs font-black uppercase text-primary tracking-wider border-b border-grey-light pb-2">
              Geographic Area Meta Setup — {selectedWorkshopLabel}
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-grey uppercase">Province</label>
              <select value={geoForm.province} onChange={(e) => setGeoForm(p=>({...p, province: e.target.value}))} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm h-[38px] text-grey-dark focus:ring-2 focus:ring-primary/10 bg-white">
                {GEO_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
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
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-grey-dark">
                  {selectedWorkshopLabel}
                </span>
                <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                  {filteredRecords.length} entries
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-white border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs">
                    {(sortField === 'path_url' ? (
                      <th className="py-3 px-4 font-bold cursor-pointer hover:text-primary" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                        <span className="flex items-center gap-1">Path <ArrowUpDown size={11} /></span>
                      </th>
                    ) : (
                      <th className="py-3 px-4 font-bold cursor-pointer hover:text-primary" onClick={() => { setSortField('path_url'); setSortDir('asc') }}>
                        <span className="flex items-center gap-1">Path <ArrowUpDown size={11} /></span>
                      </th>
                    ))}
                    <th className="py-3 px-4 font-bold">Type</th>
                    {(sortField === 'province' ? (
                      <th className="py-3 px-4 font-bold hidden md:table-cell cursor-pointer hover:text-primary" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                        <span className="flex items-center gap-1">Location <ArrowUpDown size={11} /></span>
                      </th>
                    ) : (
                      <th className="py-3 px-4 font-bold hidden md:table-cell cursor-pointer hover:text-primary" onClick={() => { setSortField('province'); setSortDir('asc') }}>
                        <span className="flex items-center gap-1">Location <ArrowUpDown size={11} /></span>
                      </th>
                    ))}
                    <th className="py-3 px-4 font-bold hidden md:table-cell">Meta Title</th>
                    <th className="py-3 px-4 font-bold">Active</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grey-light">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-grey text-sm">
                        No SEO records found. Click &quot;Sync Core Routes&quot; to populate global defaults.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-grey-dark font-semibold max-w-[220px] truncate">
                          {record.path_url}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${record.page_type === 'static_core' ? 'bg-primary/10 text-primary' : 'bg-green-50 text-green-700'}`}>
                            {record.page_type === 'static_core' ? 'App' : 'Geo'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-grey hidden md:table-cell">
                          {record.province && record.city ? (
                            <span>{record.city}, {record.province}</span>
                          ) : (
                            <span className="text-grey-medium">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs text-grey max-w-[200px] truncate hidden md:table-cell font-medium">
                          {record.meta_title}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(record)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase cursor-pointer transition-colors ${record.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                          >
                            {record.is_active ? 'Live' : 'Off'}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingRecord(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
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
                  <label className="text-xs font-black text-grey uppercase tracking-wide">Meta Title</label>
                  <input type="text" required value={editingRecord.meta_title} onChange={(e)=>setEditingRecord(p => p ? ({...p, meta_title: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark focus:ring-2 focus:ring-primary/10" />
                  <span className="text-[10px] text-grey-medium text-right font-medium">{editingRecord.meta_title.length}/60 chars</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-grey uppercase tracking-wide">H1 Heading</label>
                  <input type="text" required value={editingRecord.h1_heading ?? ''} onChange={(e)=>setEditingRecord(p => p ? ({...p, h1_heading: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-grey uppercase tracking-wide">Keywords</label>
                  <input type="text" placeholder="brake service, mechanic near me" value={editingRecord.meta_keywords ?? ''} onChange={(e)=>setEditingRecord(p => p ? ({...p, meta_keywords: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-grey uppercase tracking-wide">Meta Description</label>
                  <textarea required rows={4} value={editingRecord.meta_description} onChange={(e)=>setEditingRecord(p => p ? ({...p, meta_description: e.target.value}) : null)} className="w-full rounded-base border border-grey-light py-2 px-3 text-sm text-grey-dark resize-none" />
                  <span className="text-[10px] text-grey-medium text-right font-medium">{editingRecord.meta_description.length}/160 chars</span>
                </div>

                <div className="flex justify-end gap-2 border-t border-grey-light pt-4 mt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRecord(null)} className="text-grey text-xs">Cancel</Button>
                  <Button type="submit" size="sm" disabled={saving} className="bg-primary text-white font-bold text-xs px-4 flex items-center gap-1.5 shadow-sm">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
