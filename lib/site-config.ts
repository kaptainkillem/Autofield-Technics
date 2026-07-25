import { themeTokens } from '../designTokens';

export const SITE_CONFIG = {
  // ── Brand Identity ──────────────────────────────────────────────
  name: 'Top Life Mechanics',
  nameBold: 'Top Life',
  nameLight: 'Mechanics',
  tagline: 'Professional Mechanical Care, Wherever You Are',
  phone: '+27687780918',
  city: 'Johannesburg',
  region: 'Gauteng',
  country: 'ZA',
  currency: 'ZAR',

  // ── Contact ─────────────────────────────────────────────────────
  contact: {
    email: 'info@toplifemechanics.co.za',
    whatsappDisplay: '+27 68 778 0918',
    businessHours: 'Mon–Fri: 08:00–17:00, Sat: 08:00–12:00',
  },

  // ── Social Media ──────────────────────────────────────────────
  socialMedia: {
    facebook: 'https://facebook.com/autofieldstechnics',
    instagram: 'https://instagram.com/autofieldstechnics',
    // linkedin: null,
    // twitter: null,
    // tiktok: null,
  },

  // ── Address ─────────────────────────────────────────────────────
  address: {
    street: '50 Main Street',
    area: 'Marshalltown',
    countryFull: 'South Africa',
    mapUrl: 'https://www.google.com/maps/search/50+Main+Street+Marshalltown+Johannesburg+South+Africa',
  },

  // ── Business Profile ────────────────────────────────────────────
  business: {
    yearsOfExperience: '15+',
    specializations: ['Engine Repair', 'Gear box Repair', 'Diagnostic Services', 'suspension', 'brake & Clutch ', 'Auto electrical'],
    businessType: 'mobile and workshop-based',
    serviceRadius: '50km',
    mechanicCount: 1,
    companyRegistration: '2019/123456/07',
    vatNumber: 'VAT123456789',
  },

  // ── Experience & Service ────────────────────────────────────────
  experience: 'Qualified mechanic with {years} years of experience. Specializing in {specializations} and general repairs across {city}.',
  responseTime: '30 minutes',
  serviceTagline: 'Mobile + Workshop Service',

  // ── Hero ────────────────────────────────────────────────────────
  hero: {
    title: 'Professional Mechanical Care, Wherever You Are',
    description: 'Get diagnostics, repairs, and servicing in {city}.',
  },

  // ── Quotes Page ─────────────────────────────────────────────────
  quotes: {
    heroTitle: 'Get a Free Quote',
    heroDescription: 'Tell us about your vehicle and the service you need, and we will get back to you with a competitive quote.',
    howItWorksTitle: 'How it works',
    howItWorksDescription: 'Fill in your vehicle details and describe the issue. {responseTimeLabel}',
    whatsAppPrefix: 'Quote Request',
    responseTimeLabel: 'We will review your request and send a quote directly to your WhatsApp within {responseTime}.',
    locationLabel: 'Based in {city}',
    serviceAreaLabel: 'We serve the greater {city} area. On-site mobile diagnostic inspections and full workshop operations are available.',
    steps: [
      {
        title: 'Fill in your details',
        description: 'Tell us your car make, model, year and the specific mechanical service you need.',
      },
      {
        title: 'We review your request',
        description: 'Our expert mechanics assess the job parameters to prepare an accurate estimate.',
      },
      {
        title: 'Receive your quote on WhatsApp',
        description: 'Review the breakdown on your phone. Accept and book your physical repair slot instantly.',
      },
    ],
  },

  // ── Reviews ─────────────────────────────────────────────────────
  reviews: {
    subtitle: 'What {city} drivers are saying about {name}.',
  },

  // ── Services ────────────────────────────────────────────────────
  services: {
    heroTitle: 'Our Services',
    heroDescription: 'Choose a category below to explore our full range of mechanical solutions.',
    ctaText: 'Get a Free Quote',
    categoryFallbackDescription: 'Our dynamic response units handle everything from precision brake overhauls to deep computerized diagnostics directly at your location in {city}. Let us build a tailored quote for your exact vehicle model instead.',
    featureTagline: 'Rapid {city} Roadside Dispatch Response',
  },

  // ── 404 ─────────────────────────────────────────────────────────
  notFound: {
    message: 'We ran a full electronic scan on this URL, but it looks like a dead sensor. The page you are looking for has either been disassembled, moved to another workshop bay, or never rolled off the assembly line.',
  },

  // ── Privacy ─────────────────────────────────────────────────────
  privacy: {
    dataLocation: 'South Africa',
    complianceAct: 'POPIA',
  },

  // ── Footer ──────────────────────────────────────────────────────
  footer: {
    tagline: 'Qualified mechanic with {years} years of experience. Specializing in {specializations} and general repairs across {city}.',
    showSocial: true,
    showEmail: true,
    showCompanyReg: true,
  },

  // ── Service Detail ──────────────────────────────────────────────
  serviceDetail: {
    whatsAppMessageTemplate: 'Hi {customerName}, this is {name} regarding your quote request',
  },

  // ── Contact Form ────────────────────────────────────────────────
  contactForm: {
    title: 'Contact Us',
    description: '',
  },

  // ── Navigation ──────────────────────────────────────────────────
  navigation: {
    header: [
      { label: 'Services', href: '/services', external: false },
      { label: 'Locations', href: '/locations', external: false },
      { label: 'FAQ', href: '/faq', external: false },
      { label: 'Contact', href: '/contact', external: false },
      { label: 'Reviews', href: '/reviews', external: false },
      { label: 'Get a Quote', href: '/quote', external: false },
    ],
    footerQuick: [
      { label: 'Request a Quote', href: '/quote' },
      { label: 'Services', href: '/services' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
      { label: 'Reviews', href: '/reviews' },
    ],
    footerLegal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },

  // ── SEO ─────────────────────────────────────────────────────────
  seo: {
    defaultTitle: '{name} — {tagline}',
    defaultDescription: '{tagline}',
    ogImage: '/images/og-image.webp',
    keywords: ['mechanic', 'mobile mechanic', 'auto repair', 'car service', 'Johannesburg'],
  },

  // ── Feature Flags ───────────────────────────────────────────────
  features: {
    enableReviews: true,
    enableDashboard: true,
    enableOnlineBooking: true,
    enableWhatsAppQuotes: true,
    enableAdminFinance: true,
  },

  // ── Images ──────────────────────────────────────────────────────
  images: {
    heroImage: '/images/hero-image.webp',
    favicon: '/icon.svg',
    ogImage: '/images/og-image.webp',
  },

  // ── CTA Labels ──────────────────────────────────────────────────
  cta: {
    primary: 'Get a Free Quote',
    secondary: 'View Our Services',
    emergency: 'Emergency Assist',
    bookNow: 'Book Now',
    submitQuote: 'Request Quote via WhatsApp',
  },

  // ── Dashboard ───────────────────────────────────────────────────
  dashboard: {
    adminTitle: 'Executive Command Center',
    adminSubtitle: 'High-level snapshot workspace summary parameters.',
    clientTitle: 'Welcome Back',
    clientSubtitle: 'High-level overview tracking your active estimates, mechanical requests, and shared feedback logs.',
    pageTitles: {
      quotes: 'Quotes Processing Pipeline Inbox',
      leads: 'Incoming Service Requests',
      jobs: 'Active Mechanical Jobs',
      customers: 'Customer Base Profiles Directory',
      finance: 'Money Keeper Financial Ledger',
      services: 'Services Management',
      reviews: 'Reviews & Approvals',
      seo: 'Global SEO Control Deck',
      settings: 'Workspace Settings',
    },
  },

  // ── Theme Bridge ────────────────────────────────────────────────
  theme: themeTokens,
} as const;

/**
 * Replace template variables in a string with values from SITE_CONFIG.
 * Usage: replaceVars(SITE_CONFIG.some.field, { city: SITE_CONFIG.city, name: SITE_CONFIG.name })
 */
export function replaceVars(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const value = vars[key];
    return value !== undefined ? String(value) : _match;
  });
}

/**
 * Build a rich footer tagline by injecting multiple business fields.
 */
export function buildFooterTagline(): string {
  return replaceVars(SITE_CONFIG.footer.tagline, {
    years: SITE_CONFIG.business.yearsOfExperience,
    specializations: SITE_CONFIG.business.specializations.join(', '),
    city: SITE_CONFIG.city,
  });
}

/**
 * Build a rich experience tagline by injecting multiple business fields.
 */
export function buildExperienceTagline(): string {
  return replaceVars(SITE_CONFIG.experience, {
    years: SITE_CONFIG.business.yearsOfExperience,
    specializations: SITE_CONFIG.business.specializations.join(', '),
    city: SITE_CONFIG.city,
  });
}
