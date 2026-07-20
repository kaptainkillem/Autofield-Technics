import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getMergedSiteConfig } from '@/lib/get-site-config'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ContactForm } from '@/components/ContactForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getMergedSiteConfig()
  return {
    title: `Contact Us | ${config.name}`,
    description: `Get in touch with ${config.name}. Mobile mechanic services in ${config.city}. Request a quote or call us directly.`,
  }
}

export default async function ContactPage() {
  const config = await getMergedSiteConfig()
  const supabase = await createSupabaseServerClient()
  const { data: faqs } = await supabase
    .from('faqs')
    .select('question, answer')
    .eq('is_active', true)
    .eq('category', 'contact')
    .order('display_order', { ascending: true })
    .limit(3)

  return (
    <>
      {/* Hero */}
      <section className="bg-grey-light px-4 pt-16 pb-12 md:px-20 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-4xl flex flex-col items-center text-center justify-center">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Contact Us</h1>
          <p className="text-white/80 max-w-xl text-sm md:text-base">
            Have a question or need a quote? Reach out and we will get back to you within {config.responseTime}.
          </p>
        </div>
      </section>

      <PageWrapper className="max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-5">
              <h2 className="text-lg font-bold text-grey-dark">Get in Touch</h2>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-base bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-grey uppercase tracking-wide">Phone</p>
                  <a href={`tel:${config.phone}`} className="text-sm font-bold text-grey-dark hover:text-primary transition-colors no-underline">
                    {config.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-base bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-grey uppercase tracking-wide">Email</p>
                  <a href={`mailto:${config.contact.email}`} className="text-sm font-bold text-grey-dark hover:text-primary transition-colors no-underline">
                    {config.contact.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-base bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-grey uppercase tracking-wide">Address</p>
                  <p className="text-sm text-grey-dark">
                    {config.address || '50 Main Street, Marshalltown'}<br />
                    {config.city}, South Africa
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-base bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-grey uppercase tracking-wide">Business Hours</p>
                  <p className="text-sm text-grey-dark">{config.contact.businessHours}</p>
                </div>
              </div>
            </div>

            {/* Quick FAQs */}
            {faqs && faqs.length > 0 && (
              <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
                <h2 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Quick Answers</h2>
                {faqs.map((faq) => (
                  <div key={faq.question} className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-grey-dark">{faq.question}</p>
                    <p className="text-xs text-grey leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Form + Map */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-primary/5 border border-primary/20 rounded-base p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-grey-dark">Need a repair estimate?</p>
                <p className="text-xs text-grey">Fill in your vehicle details and get a quote.</p>
              </div>
              <Link href="/quote">
                <Button className="flex items-center gap-2">
                  Submit a Quote
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
              <h2 className="text-lg font-bold text-grey-dark mb-1">Send a Message</h2>
              <p className="text-xs text-grey mb-5">Fill in the form below and we will respond as soon as possible.</p>
              <ContactForm />
            </div>

            {/* Map Embed */}
            <div className="bg-white border border-grey-medium/10 rounded-base overflow-hidden shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3578.0!2d28.0473!3d-26.2041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDEyJzE0LjgiUyAyOMKwMDInNTAuMyJF!5e0!3m2!1sen!2sza!4v1"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Business Location"
                className="grayscale-[30%] hover:grayscale-0 transition-all"
              />
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
