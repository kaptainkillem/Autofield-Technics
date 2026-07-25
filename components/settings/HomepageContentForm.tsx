'use client'

import { useState, useRef, useCallback } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { sanitizeText } from '@/lib/input-sanitizer'
import { saveSuperAdminSettings } from '@/lib/settings-api'
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  RefreshCcw,
  Type,
  Layout,
  Check,
  AlertCircle,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  HomePageContent,
  HomePageContentSchema,
  allowedStepIcons,
  createDefaultHomePageContent,
  StepIcon,
} from '@/lib/homepage-content'

interface HomepageContentFormProps {
  initialData: HomePageContent | null
  workshopId: string | null
  heroImageUrl?: string | null
  onSaved?: () => void
}

export function HomepageContentForm({
  initialData,
  workshopId,
  heroImageUrl,
  onSaved,
}: HomepageContentFormProps) {
  const [form, setForm] = useState<HomePageContent>(
    initialData ? HomePageContentSchema.parse(initialData) : createDefaultHomePageContent()
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const update = useCallback(
    <K extends keyof HomePageContent>(section: K, value: HomePageContent[K]) => {
      setForm((prev) => ({ ...prev, [section]: value }))
      if (errors.length > 0) setErrors([])
    },
    [errors]
  )

  const updateHero = (patch: Partial<HomePageContent['hero']>) => {
    setForm((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }))
  }

  const updateSection = <K extends keyof HomePageContent>(
    section: K,
    patch: Partial<HomePageContent[K]>
  ) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }

  const updateFeatureItem = (index: number, patch: Partial<HomePageContent['features']['items'][0]>) => {
    setForm((prev) => {
      const items = [...prev.features.items]
      items[index] = { ...items[index], ...patch }
      return { ...prev, features: { ...prev.features, items } }
    })
  }

  const addFeatureItem = () => {
    if (form.features.items.length >= 4) {
      toast.error('Maximum 4 feature blocks allowed')
      return
    }
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        items: [
          ...prev.features.items,
          { heading: 'New Feature', text: 'Describe what makes your service special.', imageUrl: '' },
        ],
      },
    }))
  }

  const removeFeatureItem = (index: number) => {
    setForm((prev) => {
      const items = prev.features.items.filter((_, i) => i !== index)
      return { ...prev, features: { ...prev.features, items } }
    })
  }

  const updateStep = (index: number, patch: Partial<HomePageContent['howItWorks']['steps'][0]>) => {
    setForm((prev) => {
      const steps = [...prev.howItWorks.steps]
      steps[index] = { ...steps[index], ...patch }
      return { ...prev, howItWorks: { ...prev.howItWorks, steps } }
    })
  }

  const addStep = () => {
    if (form.howItWorks.steps.length >= 6) {
      toast.error('Maximum 6 steps allowed')
      return
    }
    setForm((prev) => ({
      ...prev,
      howItWorks: {
        ...prev.howItWorks,
        steps: [
          ...prev.howItWorks.steps,
          { heading: 'New Step', description: 'Describe this step.', iconName: 'Wrench' },
        ],
      },
    }))
  }

  const removeStep = (index: number) => {
    if (form.howItWorks.steps.length <= 1) {
      toast.error('At least one step is required')
      return
    }
    setForm((prev) => {
      const steps = prev.howItWorks.steps.filter((_, i) => i !== index)
      return { ...prev, howItWorks: { ...prev.howItWorks, steps } }
    })
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    callback: (url: string) => void
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    if (!workshopId) {
      toast.error('Workshop ID is required to upload images')
      return
    }

    setUploadingField(field)
    const ext = file.name.split('.').pop() || 'webp'
    const path = `${workshopId}/${field}-${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })

    if (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image')
      setUploadingField(null)
      return
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(path)
    callback(data.publicUrl)
    setUploadingField(null)
    toast.success('Image uploaded')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])

    if (!workshopId) {
      toast.error('Workshop ID is required')
      return
    }

    const result = HomePageContentSchema.safeParse(form)
    if (!result.success) {
      setErrors(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`))
      toast.error('Please fix the validation errors')
      return
    }

    setSaving(true)

    try {
      await saveSuperAdminSettings(workshopId!, {
        home_page_content: result.data,
      })

      toast.success('Homepage content saved! Refresh the homepage to see changes.')
      onSaved?.()
    } catch (err: any) {
      console.error('Homepage content save error:', err)
      toast.error(err.message || 'Failed to save homepage content')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (confirm('Reset to default template? This will overwrite your current homepage content.')) {
      setForm(createDefaultHomePageContent())
    }
  }

  const SectionHeader = ({ icon: Icon, title }: { icon: typeof Sparkles; title: string }) => (
    <div className="flex items-center gap-2 pb-3 border-b border-grey-light">
      <Icon size={18} className="text-primary" />
      <h3 className="text-base font-bold text-grey-dark">{title}</h3>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {errors.length > 0 && (
        <div className="bg-error/10 border border-error/20 rounded-base p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-error font-semibold text-sm">
            <AlertCircle size={16} />
            Validation errors
          </div>
          <ul className="text-xs text-error/80 list-disc pl-4">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <SectionHeader icon={LayoutTemplate} title="Hero Section" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Hero Title"
            value={form.hero.title}
            onChange={(v) => updateHero({ title: v })}
            placeholder="Professional Mechanical Care, Wherever You Are"
          />
          <TextField
            label="Primary CTA Label"
            value={form.hero.primaryCtaLabel}
            onChange={(v) => updateHero({ primaryCtaLabel: v })}
            placeholder="Get a Free Quote"
          />
          <TextField
            label="Primary CTA Link"
            value={form.hero.primaryCtaHref}
            onChange={(v) => updateHero({ primaryCtaHref: v })}
            placeholder="/quote"
          />
          <TextField
            label="Secondary CTA Label (optional)"
            value={form.hero.secondaryCtaLabel || ''}
            onChange={(v) => updateHero({ secondaryCtaLabel: v || undefined })}
            placeholder="View Our Services"
          />
          <TextField
            label="Secondary CTA Link (optional)"
            value={form.hero.secondaryCtaHref || ''}
            onChange={(v) => updateHero({ secondaryCtaHref: v || undefined })}
            placeholder="/services"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="heroShowImage"
            type="checkbox"
            checked={form.hero.showImage}
            onChange={(e) => updateHero({ showImage: e.target.checked })}
            className="h-4 w-4 rounded border-grey-medium text-primary focus:ring-primary"
          />
          <label htmlFor="heroShowImage" className="text-sm text-grey-dark cursor-pointer">
            Show hero image
          </label>
        </div>
        <ImageField
          label="Hero Image"
          imageUrl={form.hero.imageUrl || heroImageUrl || ''}
          onImageUrlChange={(v) => updateHero({ imageUrl: v || null })}
          onUpload={(e) =>
            handleImageUpload(e, 'hero', (url) => updateHero({ imageUrl: url }))
          }
          uploading={uploadingField === 'hero'}
        />
        <TextArea
          label="Hero Description"
          value={form.hero.description}
          onChange={(v) => updateHero({ description: v })}
          placeholder="From emergency roadside assistance to expert workshop repairs in {city}."
          hint="Use {city}, {name}, {phone}, {whatsapp}, {years}, {specializations} as placeholders."
        />
      </div>

      {/* Features Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-grey-light">
          <div className="flex items-center gap-2">
            <Layout size={18} className="text-primary" />
            <h3 className="text-base font-bold text-grey-dark">Feature Blocks</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="featuresEnabled"
              type="checkbox"
              checked={form.features.enabled}
              onChange={(e) => updateSection('features', { enabled: e.target.checked })}
              className="h-4 w-4 rounded border-grey-medium text-primary focus:ring-primary"
            />
            <label htmlFor="featuresEnabled" className="text-sm text-grey-dark cursor-pointer">
              Enabled
            </label>
          </div>
        </div>
        {form.features.enabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Section Title (optional)"
                value={form.features.title || ''}
                onChange={(v) => updateSection('features', { title: v || undefined })}
              />
              <TextField
                label="Section Subtitle (optional)"
                value={form.features.subtitle || ''}
                onChange={(v) => updateSection('features', { subtitle: v || undefined })}
              />
            </div>
            <div className="flex flex-col gap-4">
              {form.features.items.map((feature, index) => (
                <div key={index} className="border border-grey-light rounded-base p-4 bg-grey-lightest/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-grey-dark uppercase">Feature {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFeatureItem(index)}
                      className="text-error hover:text-error/80 transition-colors"
                      title="Remove feature"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Heading"
                      value={feature.heading}
                      onChange={(v) => updateFeatureItem(index, { heading: v })}
                    />
                    <ImageField
                      label="Image"
                      imageUrl={feature.imageUrl}
                      onImageUrlChange={(v) => updateFeatureItem(index, { imageUrl: v })}
                      onUpload={(e) =>
                        handleImageUpload(e, `feature-${index}`, (url) =>
                          updateFeatureItem(index, { imageUrl: url })
                        )
                      }
                      uploading={uploadingField === `feature-${index}`}
                    />
                  </div>
                  <TextArea
                    label="Text"
                    value={feature.text}
                    onChange={(v) => updateFeatureItem(index, { text: v })}
                    rows={3}
                  />
                </div>
              ))}
              <Button
                type="button"
                onClick={addFeatureItem}
                disabled={form.features.items.length >= 4}
                className="flex items-center gap-2 bg-white border border-grey-medium text-grey-dark hover:bg-grey-lightest"
              >
                <Plus size={16} />
                Add Feature Block
              </Button>
            </div>
          </>
        )}
      </div>

      {/* How It Works Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-grey-light">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h3 className="text-base font-bold text-grey-dark">How It Works</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="hiwEnabled"
              type="checkbox"
              checked={form.howItWorks.enabled}
              onChange={(e) => updateSection('howItWorks', { enabled: e.target.checked })}
              className="h-4 w-4 rounded border-grey-medium text-primary focus:ring-primary"
            />
            <label htmlFor="hiwEnabled" className="text-sm text-grey-dark cursor-pointer">
              Enabled
            </label>
          </div>
        </div>
        {form.howItWorks.enabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Title"
                value={form.howItWorks.title}
                onChange={(v) => updateSection('howItWorks', { title: v })}
              />
              <TextArea
                label="Subtitle"
                value={form.howItWorks.subtitle}
                onChange={(v) => updateSection('howItWorks', { subtitle: v })}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-4">
              {form.howItWorks.steps.map((step, index) => (
                <div key={index} className="border border-grey-light rounded-base p-4 bg-grey-lightest/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-grey-dark uppercase">Step {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-error hover:text-error/80 transition-colors"
                      title="Remove step"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      label="Heading"
                      value={step.heading}
                      onChange={(v) => updateStep(index, { heading: v })}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                        <Layout size={14} />
                        Icon
                      </label>
                      <select
                        value={step.iconName}
                        onChange={(e) => updateStep(index, { iconName: e.target.value as StepIcon })}
                        className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark"
                      >
                        {allowedStepIcons.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                    <TextArea
                      label="Description"
                      value={step.description}
                      onChange={(v) => updateStep(index, { description: v })}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addStep}
                disabled={form.howItWorks.steps.length >= 6}
                className="flex items-center gap-2 bg-white border border-grey-medium text-grey-dark hover:bg-grey-lightest"
              >
                <Plus size={16} />
                Add Step
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Services Grid Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-grey-light">
          <div className="flex items-center gap-2">
            <Layout size={18} className="text-primary" />
            <h3 className="text-base font-bold text-grey-dark">Services Grid</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="servicesEnabled"
              type="checkbox"
              checked={form.servicesGrid.enabled}
              onChange={(e) => updateSection('servicesGrid', { enabled: e.target.checked })}
              className="h-4 w-4 rounded border-grey-medium text-primary focus:ring-primary"
            />
            <label htmlFor="servicesEnabled" className="text-sm text-grey-dark cursor-pointer">
              Enabled
            </label>
          </div>
        </div>
        {form.servicesGrid.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Title"
              value={form.servicesGrid.title}
              onChange={(v) => updateSection('servicesGrid', { title: v })}
            />
            <TextField
              label="Subtitle"
              value={form.servicesGrid.subtitle}
              onChange={(v) => updateSection('servicesGrid', { subtitle: v })}
            />
            <TextField
              label="CTA Label"
              value={form.servicesGrid.ctaLabel}
              onChange={(v) => updateSection('servicesGrid', { ctaLabel: v })}
            />
          </div>
        )}
      </div>

      {/* Testimonials Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-grey-light">
          <div className="flex items-center gap-2">
            <Type size={18} className="text-primary" />
            <h3 className="text-base font-bold text-grey-dark">Testimonials</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="testimonialsEnabled"
              type="checkbox"
              checked={form.testimonials.enabled}
              onChange={(e) => updateSection('testimonials', { enabled: e.target.checked })}
              className="h-4 w-4 rounded border-grey-medium text-primary focus:ring-primary"
            />
            <label htmlFor="testimonialsEnabled" className="text-sm text-grey-dark cursor-pointer">
              Enabled
            </label>
          </div>
        </div>
        {form.testimonials.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Title"
              value={form.testimonials.title}
              onChange={(v) => updateSection('testimonials', { title: v })}
            />
            <TextField
              label="Subtitle"
              value={form.testimonials.subtitle}
              onChange={(v) => updateSection('testimonials', { subtitle: v })}
            />
          </div>
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-grey-light">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={18} className="text-primary" />
            <h3 className="text-base font-bold text-grey-dark">Bottom CTA</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="bottomCtaEnabled"
              type="checkbox"
              checked={form.bottomCta.enabled}
              onChange={(e) => updateSection('bottomCta', { enabled: e.target.checked })}
              className="h-4 w-4 rounded border-grey-medium text-primary focus:ring-primary"
            />
            <label htmlFor="bottomCtaEnabled" className="text-sm text-grey-dark cursor-pointer">
              Enabled
            </label>
          </div>
        </div>
        {form.bottomCta.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Heading"
              value={form.bottomCta.heading}
              onChange={(v) => updateSection('bottomCta', { heading: v })}
            />
            <TextField
              label="Button Label"
              value={form.bottomCta.buttonLabel}
              onChange={(v) => updateSection('bottomCta', { buttonLabel: v })}
            />
            <TextField
              label="Button Link"
              value={form.bottomCta.buttonHref}
              onChange={(v) => updateSection('bottomCta', { buttonHref: v })}
            />
            <TextArea
              label="Description"
              value={form.bottomCta.description}
              onChange={(v) => updateSection('bottomCta', { description: v })}
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Sticky CTA Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-grey-light">
          <div className="flex items-center gap-2">
            <Layout size={18} className="text-primary" />
            <h3 className="text-base font-bold text-grey-dark">Mobile Sticky CTA</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="stickyCtaEnabled"
              type="checkbox"
              checked={form.stickyCta.enabled}
              onChange={(e) => updateSection('stickyCta', { enabled: e.target.checked })}
              className="h-4 w-4 rounded border-grey-medium text-primary focus:ring-primary"
            />
            <label htmlFor="stickyCtaEnabled" className="text-sm text-grey-dark cursor-pointer">
              Enabled
            </label>
          </div>
        </div>
        {form.stickyCta.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Title"
              value={form.stickyCta.title}
              onChange={(v) => updateSection('stickyCta', { title: v })}
            />
            <TextField
              label="Button Label"
              value={form.stickyCta.buttonLabel}
              onChange={(v) => updateSection('stickyCta', { buttonLabel: v })}
            />
            <TextField
              label="Link"
              value={form.stickyCta.href}
              onChange={(v) => updateSection('stickyCta', { href: v })}
            />
            <TextArea
              label="Subtitle"
              value={form.stickyCta.subtitle}
              onChange={(v) => updateSection('stickyCta', { subtitle: v })}
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-4 mt-2 bg-white border border-grey-medium/10 rounded-base p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 bg-white border border-grey-medium text-grey-dark hover:bg-grey-lightest"
          >
            <RefreshCcw size={16} />
            Reset to Defaults
          </Button>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="bg-primary text-white font-bold py-2.5 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : 'Save Homepage Content'}</span>
        </Button>
      </div>
    </form>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
        <Type size={14} />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark"
      />
      {hint && <p className="text-[11px] text-grey-medium">{hint}</p>}
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  rows?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
        <Type size={14} />
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark resize-none"
      />
      {hint && <p className="text-[11px] text-grey-medium">{hint}</p>}
    </div>
  )
}

function ImageField({
  label,
  imageUrl,
  onImageUrlChange,
  onUpload,
  uploading,
}: {
  label: string
  imageUrl: string
  onImageUrlChange: (value: string) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
        <ImageIcon size={14} />
        {label}
      </label>
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="h-12 w-12 object-cover rounded-base border border-grey-light bg-white"
          />
        ) : (
          <div className="h-12 w-12 rounded-base border border-grey-light bg-grey-lightest flex items-center justify-center">
            <ImageIcon size={20} className="text-grey-medium" />
          </div>
        )}
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded-base border border-grey-light bg-white py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={onUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  )
}
