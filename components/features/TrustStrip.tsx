import { Star, ShieldCheck, MapPin, Wrench } from 'lucide-react'

export function TrustStrip() {
  const items = [
    { icon: <Star size={20} />, label: 'Trusted by Johannesburg drivers' },
    { icon: <ShieldCheck size={20} />, label: '15+ years experience' },
    { icon: <MapPin size={20} />, label: 'Serving within 50km' },
    { icon: <Wrench size={20} />, label: 'Mobile + workshop service' },
  ]

  return (
    <section className="bg-white border-b border-grey-light px-4 py-5">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-center gap-2 text-sm font-semibold text-grey-dark">
            <span className="text-primary">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}