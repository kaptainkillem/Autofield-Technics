import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveWorkshopBySlug } from '@/lib/workshop';
import Link from 'next/link';
import { Wrench, CheckCircle, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const workshop = await resolveWorkshopBySlug(slug);
  if (!workshop) return { title: 'Workshop Not Found' };
  return {
    title: `${workshop.name} | Mobile Mechanic Services`,
    description: `Get professional mobile mechanic services from ${workshop.name}. Request a free quote today.`,
  };
}

export default async function WorkshopHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await resolveWorkshopBySlug(slug);
  if (!workshop) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href={`/w/${workshop.slug}`} className="no-underline text-xl font-bold text-white">
            {workshop.name}
          </Link>
          <nav className="flex items-center gap-4">
            <Link href={`/w/${workshop.slug}/quote`} className="bg-white text-primary px-4 py-2 rounded-base font-semibold text-sm no-underline hover:bg-white/90 transition-colors">
              Get a Quote
            </Link>
            <Link href={`/signup?workshop_id=${workshop.id}`} className="text-white border border-white/40 rounded-base px-4 py-2 text-sm font-semibold no-underline hover:bg-white/10 transition-colors">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-grey-lightest py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-grey mb-4">
              {workshop.name}
            </h1>
            <p className="text-lg text-grey mb-8 max-w-2xl mx-auto">
              Professional mobile mechanic services. Request a quote and get fast service at your location.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/w/${workshop.slug}/quote`}
                className="btn-primary flex items-center gap-2 px-6 py-3 font-semibold"
              >
                <Wrench className="h-5 w-5" />
                Request a Free Quote
              </Link>
              <Link
                href={`/signup?workshop_id=${workshop.id}`}
                className="btn-secondary flex items-center gap-2 px-6 py-3 font-semibold"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-grey mb-2">Expert Service</h3>
              <p className="text-sm text-grey-medium">Qualified mechanics with professional diagnostic tools</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-grey mb-2">Transparent Pricing</h3>
              <p className="text-sm text-grey-medium">Clear quotes with no hidden costs or surprises</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-grey mb-2">Fast Response</h3>
              <p className="text-sm text-grey-medium">WhatsApp or phone support for quick communications</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-grey-dark text-white/70 py-6 px-4 text-center text-sm">
        &copy; {new Date().getFullYear()} {workshop.name}. All rights reserved.
      </footer>
    </div>
  );
}
