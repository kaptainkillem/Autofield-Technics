'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { Search, ChevronRight, ArrowLeft, MapPin, Wrench, Building2, Compass, Globe, ChevronLeft } from 'lucide-react'
import { useSiteConfig } from '@/components/providers/SiteConfigProvider'

type SEORecord = {
  id: string
  path_url: string
  page_type: string
  province: string
  city: string
  suburb: string
  is_active: boolean
}

const ITEMS_PER_PAGE = 9

export default function LocationsArchivePage() {
  const [loading, setLoading] = useState(true)
  const [rawRecords, setRawRecords] = useState<SEORecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const config = useSiteConfig()

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function fetchActiveRegistryNodes() {
      let query = (supabase as any)
        .from('seo_registry')
        .select('id, path_url, page_type, province, city, suburb, is_active')
        .eq('page_type', 'geographic_node')
        .eq('is_active', true)

      if (config.workshopId) {
        query = query.or(`workshop_id.eq.${config.workshopId},workshop_id.is.null`)
      }

      const { data } = await query
      
      setRawRecords(data || [])
      setLoading(false)
    }
    fetchActiveRegistryNodes()
  }, [config.workshopId])

  // Reset pagination depth whenever layout steps alter
  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province)
    setSelectedCity(null)
    setCurrentPage(1)
  }

  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setCurrentPage(1)
  }

  const resetDrilldown = () => {
    setSelectedProvince(null)
    setSelectedCity(null)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const goBackALayer = () => {
    setCurrentPage(1)
    if (selectedCity) {
      setSelectedCity(null)
    } else if (selectedProvince) {
      setSelectedProvince(null)
    }
  }

  // --- HIERARCHICAL COMPILING MATRIX ---
  const provincesList = Array.from(new Set(rawRecords.map(r => r.province))).sort()

  const citiesList = selectedProvince
    ? Array.from(new Set(rawRecords.filter(r => r.province === selectedProvince).map(r => r.city))).sort()
    : []

  // Global search filters out text match constraints instantly across provinces, cities, or suburbs
  const filteredRecords = rawRecords.filter(r => {
    const matchesProvince = !selectedProvince || r.province === selectedProvince
    const matchesCity = !selectedCity || r.city === selectedCity
    
    const term = searchQuery.toLowerCase().trim()
    return matchesProvince && matchesCity && (
      !term || 
      r.suburb.toLowerCase().includes(term) || 
      r.city.toLowerCase().includes(term) || 
      r.province.toLowerCase().includes(term)
    )
  })

  // --- PAGINATION BREAKDOWN COMPUTATION ---
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Build the responsive dynamic segments for the Breadcrumb component array
  const breadcrumbSegments = [
    { label: 'Home', href: '/' },
    { label: 'Locations', href: selectedProvince ? '/locations' : undefined, onClick: selectedProvince ? resetDrilldown : undefined }
  ]
  if (selectedProvince) {
    breadcrumbSegments.push({ 
      label: selectedProvince, 
      href: selectedCity ? '#_province' : undefined,
      onClick: selectedCity ? () => setSelectedCity(null) : undefined 
    })
  }
  if (selectedCity) {
    breadcrumbSegments.push({ label: selectedCity, href: undefined, onClick: undefined })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-grey-lightest items-center justify-center">
        <Globe className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Dynamic Services Hero Section Layout */}
      <ServicesHero
        title="Our Mechanical Service Footprint"
        description="Select your province or look up your specific suburban boundary loop to locate an on-site mobile mechanic dispatch hub near you."
      />

      {/* Breadcrumb Navigation Strip */}
      <div className="bg-grey-lightest border-t border-b border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Breadcrumb segments={breadcrumbSegments} />
          
          {/* Real-time Local search utility input desk */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
            <input
              type="text"
              placeholder="Search city, province or suburb..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset page on filter changes
                if (e.target.value.trim().length > 0 && (!selectedProvince || !selectedCity)) {
                  setSelectedProvince(null)
                  setSelectedCity(null)
                }
              }}
              className="w-full rounded-base border border-grey-light bg-white py-2 pl-9 pr-4 text-xs text-grey-dark focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium h-9"
            />
          </div>
        </div>
      </div>

      {/* Main Hierarchical Interaction Section */}
      <section className="bg-white px-4 pt-12 pb-24 md:px-20 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left Column: Context, Trust Indicators, and Active Status */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-grey-dark mb-2">
                  Dispatch Coverage
                </h2>
                <p className="text-xs text-grey leading-relaxed">
                  We operate fully equipped dynamic mobile workshop units. There is no need to tow your vehicle to a stationary workshop branch—our technicians execute servicing right inside your home driveway or workplace parkade space.
                </p>
              </div>

              {/* Drill status summary widget element */}
              <div className="bg-grey-lightest border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-3">
                <p className="text-xs font-bold text-grey-dark flex items-center gap-2 border-b border-grey-light pb-2 uppercase tracking-wide">
                  <Compass size={14} className="text-primary" />
                  <span>Coverage Summary</span>
                </p>
                <div className="space-y-1 text-xs font-medium text-grey">
                  <p>Active Provinces: <span className="text-black font-bold">{provincesList.length}</span></p>
                  <p>Matches Found: <span className="text-black font-bold">{filteredRecords.length} Areas</span></p>
                  {selectedProvince && <p className="pt-1 text-primary">Viewing: <span className="font-bold capitalize">{selectedCity || selectedProvince}</span></p>}
                </div>
              </div>
            </div>

            {/* Right Column: Upgraded Drilling Node Interaction Area */}
            <div className="lg:col-span-8 bg-white border border-grey-medium/10 rounded-base p-6 md:p-8 shadow-sm min-h-[480px] flex flex-col justify-between">
              
              <div className="w-full">
                {/* STAGE 1: Extended Bigger Province Selection Layout Cards */}
                {!selectedProvince && searchQuery.trim().length === 0 && (
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xs font-black uppercase text-grey tracking-wider border-b border-grey-light pb-2">Select Your Province Region</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {provincesList.map(prov => {
                        const hubsCount = rawRecords.filter(r => r.province === prov).length
                        return (
                          <button
                            key={prov}
                            onClick={() => handleProvinceSelect(prov)}
                            className="group text-left bg-white border border-grey-medium/20 p-6 rounded-base hover:border-primary shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer focus:outline-none min-h-[90px]"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-grey-lightest group-hover:bg-primary/10 text-grey group-hover:text-primary rounded-base transition-colors border border-grey-medium/5">
                                <Building2 size={20} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-grey-dark text-base">{prov}</span>
                                <span className="text-xs text-grey-medium mt-0.5">{hubsCount} Area active</span>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-grey-medium group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STAGE 2: Extended Bigger City Selection Layout Cards */}
                {selectedProvince && !selectedCity && searchQuery.trim().length === 0 && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 border-b border-grey-light pb-2 justify-between">
                      <h3 className="text-xs font-black uppercase text-grey tracking-wider">Cities inside {selectedProvince}</h3>
                      <button onClick={goBackALayer} className="inline-flex items-center gap-1 text-[11px] font-bold text-grey hover:text-primary transition-colors focus:outline-none">
                        <ArrowLeft size={12} />
                        <span>Back to Provinces</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {citiesList.map(city => {
                        const suburbCount = rawRecords.filter(r => r.province === selectedProvince && r.city === city).length
                        return (
                          <button
                            key={city}
                            onClick={() => handleCitySelect(city)}
                            className="group text-left bg-white border border-grey-medium/20 p-6 rounded-base hover:border-primary shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer focus:outline-none min-h-[90px]"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-grey-lightest group-hover:bg-primary/10 text-grey group-hover:text-primary rounded-base transition-colors border border-grey-medium/5">
                                <MapPin size={20} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-grey-dark text-base capitalize truncate">{city}</span>
                                <span className="text-xs text-grey-medium mt-0.5">{suburbCount} service areas active</span>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-grey-medium group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STAGE 3: Suburb Direct Terminal Cards with Search & Pagination Bounds */}
                {((selectedProvince && selectedCity) || searchQuery.trim().length > 0) && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-4 border-b border-grey-light pb-2">
                      <h3 className="text-xs font-black uppercase text-grey tracking-wider">
                        {searchQuery.trim().length > 0 ? 'Discovered Service Nodes' : `Serviced Suburbs in ${selectedCity}`}
                      </h3>
                      {searchQuery.trim().length === 0 && (
                        <button onClick={goBackALayer} className="inline-flex items-center gap-1 text-[11px] font-bold text-grey hover:text-primary transition-colors focus:outline-none">
                          <ArrowLeft size={12} />
                          <span>Back to Cities</span>
                    </button>
                      )}
                    </div>

                    {paginatedRecords.length === 0 ? (
                      <div className="text-center py-16 text-grey text-xs font-medium bg-grey-lightest rounded-base border border-dashed border-grey-medium/30">
                        No active mechanical service hubs found matching that query parameter.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paginatedRecords.map(record => (
                          <Link 
                            key={record.id} 
                            href={record.path_url}
                            className="no-underline group"
                          >
                            <span className="flex items-center justify-between p-5 bg-white border border-grey-medium/20 rounded-base group-hover:border-primary shadow-sm group-hover:shadow-md transition-all text-grey-dark min-h-[80px]">
                              <span className="flex items-center gap-3.5 min-w-0">
                                <div className="p-2.5 bg-grey-lightest group-hover:bg-primary/5 text-grey-medium group-hover:text-primary rounded transition-all">
                                  <Wrench size={15} className="group-hover:rotate-45 transition-all" />
                                </div>
                                <span className="flex flex-col min-w-0">
                                  <strong className="text-sm font-extrabold text-grey-dark capitalize truncate group-hover:text-primary transition-colors">{record.suburb}</strong>
                                  <span className="text-[11px] text-grey capitalize truncate mt-0.5">{record.city}, {record.province}</span>
                                </span>
                              </span>
                              <ChevronRight size={14} className="text-grey-medium group-hover:text-primary transition-all shrink-0" />
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 🎛️ Responsive Navigation Pagination Toolbar (Only triggers if row lists overflow 9 entries) */}
              {totalPages > 1 && ((selectedProvince && selectedCity) || searchQuery.trim().length > 0) && (
                <div className="flex items-center justify-between border-t border-grey-light pt-4 mt-8 w-full text-xs font-semibold text-grey">
                  <p className="font-medium text-grey-medium">
                    Showing <span className="text-black font-bold">{startIndex + 1}</span> to{' '}
                    <span className="text-black font-bold">
                      {Math.min(startIndex + ITEMS_PER_PAGE, filteredRecords.length)}
                    </span>{' '}
                    of <span className="text-black font-bold">{filteredRecords.length}</span> boundaries
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="inline-flex items-center gap-1 px-3 h-8 border border-grey-medium/30 hover:border-primary text-grey-dark hover:text-primary bg-white disabled:opacity-40 disabled:hover:text-grey-dark disabled:hover:border-grey-medium/30 rounded-base transition-all font-bold select-none cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-base text-xs font-bold transition-all border ${
                            currentPage === i + 1
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-grey border-grey-medium/30 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="inline-flex items-center gap-1 px-3 h-8 border border-grey-medium/30 hover:border-primary text-grey-dark hover:text-primary bg-white disabled:opacity-40 disabled:hover:text-grey-dark disabled:hover:border-grey-medium/30 rounded-base transition-all font-bold select-none cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
    </>
  )
}