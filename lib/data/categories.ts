export interface Category {
  id: string
  title: string
  icon: string
  description: string
}

export const categories: Category[] = [
  {
    id: 'Fluids',
    title: 'Fluids & Maintenance',
    icon: 'Droplet',
    description: 'Oil, filters, and fluid top-ups.',
  },
  {
    id: 'Engine',
    title: 'Engine & Diagnostics',
    icon: 'Cpu',
    description: 'Fault scanning, tuning, and major repairs.',
  },
  {
    id: 'Wheels',
    title: 'Wheels & Brakes',
    icon: 'Disc',
    description: 'Brake pads, discs, and suspension checks.',
  },
]
