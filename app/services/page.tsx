import Link from 'next/link'
import { Droplet, Cpu, Disc } from 'lucide-react'
import { categories, type Category } from '@/lib/data/categories'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'

const iconMap: Record<Category['icon'], React.ReactNode> = {
  Droplet: <Droplet size={40} />,
  Cpu: <Cpu size={40} />,
  Disc: <Disc size={40} />,
}

export default function ServicesPage() {
  return (
    <>
      <ServicesHero
        title="Our Services"
        description="Choose a category below to explore our full range of mechanical services."
        showQuoteButton
      />

      <div className="bg-grey-lightest border-t border-grey-medium/30 px-4 pt-4 pb-5 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Services' },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 pt-6 pb-16 md:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/services/${cat.id}`}
                className="bg-primary text-white rounded-base shadow-base p-6 flex flex-col items-center text-center gap-4 no-underline transition-all duration-200 hover:shadow-md hover:-translate-y-1"
              >
                <div className="text-white">{iconMap[cat.icon]}</div>
                <h3 className="text-xl font-semibold text-white">{cat.title}</h3>
                <p className="text-white/80">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
