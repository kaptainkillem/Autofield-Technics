import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveWorkshopBySlug } from '@/lib/workshop';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ServicesHero } from '@/components/features/ServicesHero';
import { QuoteForm } from '@/components/QuoteForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const workshop = await resolveWorkshopBySlug(slug);
  if (!workshop) return { title: 'Workshop Not Found' };
  return {
    title: `Get a Free Quote | ${workshop.name}`,
    description: `Request a free repair quote from ${workshop.name}. Mobile mechanic services. Fast response via WhatsApp.`,
  };
}

export default async function WorkshopQuotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await resolveWorkshopBySlug(slug);
  if (!workshop) notFound();

  return (
    <>
      <header className="bg-primary text-white py-4">
        <div className="max-w-6xl mx-auto px-4">
          <Link href={`/w/${workshop.slug}`} className="no-underline text-lg font-bold text-white">
            &larr; {workshop.name}
          </Link>
        </div>
      </header>

      <ServicesHero
        title={`Get a Free Quote from ${workshop.name}`}
        description="Fill in your details and we'll send you an accurate estimate for your repair."
      />

      <div className="bg-grey-lightest border-t border-b border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: `/w/${workshop.slug}` },
              { label: 'Get a Quote' },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 pt-12 pb-24 md:px-20 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8">
              <QuoteForm workshopId={workshop.id} />
            </div>

            <div className="lg:col-span-4 bg-grey-lightest rounded-base p-6 border border-grey-medium/10">
              <h3 className="font-bold text-grey mb-3">Why {workshop.name}?</h3>
              <ul className="space-y-3 text-sm text-grey-medium">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">&#10003;</span>
                  Fast, transparent quotes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">&#10003;</span>
                  WhatsApp notifications
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">&#10003;</span>
                  No obligation to book
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-grey-medium/20">
                <p className="text-xs text-grey-medium">
                  Don&apos;t have an account?{' '}
                  <Link href={`/signup?workshop_id=${workshop.id}`} className="text-primary font-semibold no-underline">
                    Sign up here
                  </Link>{' '}
                  to track your quotes and appointments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
