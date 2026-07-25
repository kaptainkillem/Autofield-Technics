// tailwind.config.ts
import type { Config } from 'tailwindcss'
import { SITE_CONFIG } from './lib/site-config'

const { colors, typography, spacing, borderRadius, shadows, breakpoints } = SITE_CONFIG.theme

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colors and typography are now fully dynamic via CSS variables and @theme
      // in globals.css, overridden at runtime by app/layout.tsx from
      // business_settings. This ensures brand colors and fonts propagate to every
      // utility class across the entire site.
      fontSize: {
        xs: typography.sizes.xs,
        sm: typography.sizes.sm,
        base: typography.sizes.base,
        lg: typography.sizes.lg,
        xl: typography.sizes.xl,
        '2xl': typography.sizes['2xl'],
        '3xl': typography.sizes['3xl'],
        '4xl': typography.sizes['4xl'],
      },
      fontWeight: {
        thin: typography.weights.thin,
        extralight: typography.weights.extralight,
        light: typography.weights.light,
        normal: typography.weights.normal,
        medium: typography.weights.medium,
        semibold: typography.weights.semibold,
        bold: typography.weights.bold,
        extrabold: typography.weights.extrabold,
        black: typography.weights.black,
      },
      lineHeight: {
        tight: typography.lineHeights.tight,
        normal: typography.lineHeights.normal,
        relaxed: typography.lineHeights.relaxed,
        loose: typography.lineHeights.loose,
      },

      // Spacing scale
      spacing: {
        0: spacing[0],
        1: spacing[1],
        2: spacing[2],
        3: spacing[3],
        4: spacing[4],
        5: spacing[5],
        6: spacing[6],
        8: spacing[8],
        10: spacing[10],
        12: spacing[12],
        16: spacing[16],
        20: spacing[20],
        24: spacing[24],
        32: spacing[32],
      },

      // Border radius
      borderRadius: {
        none: borderRadius.none,
        sm: borderRadius.sm,
        base: borderRadius.base,
        md: borderRadius.md,
        lg: borderRadius.lg,
        xl: borderRadius.xl,
        full: borderRadius.full,
      },

      // Box shadows
      boxShadow: {
        none: shadows.none,
        sm: shadows.sm,
        DEFAULT: shadows.base,
        base: shadows.base,
        md: shadows.md,
        lg: shadows.lg,
        xl: shadows.xl,
        elevated: shadows.elevated,
      },

      // Breakpoints
      screens: {
        mobile: breakpoints.mobile,
        'mobile-lg': breakpoints.mobileLg,
        tablet: breakpoints.tablet,
        desktop: breakpoints.desktop,
        'desktop-lg': breakpoints.desktopLg,
        wide: breakpoints.wide,
      },

      // Transitions
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '350ms',
        slowest: '500ms',
      },
      transitionTimingFunction: {
        base: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // Z-index
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
      },

      // Gradients
      backgroundImage: {
        'gradient-primary': colors.gradients.primary,
        'gradient-subtle': colors.gradients.subtle,
      },

      // Animations
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [
    // Custom plugin for utility classes
    function ({ addComponents, theme }: any) {
      addComponents({
        '.btn-primary': {
          '@apply px-6 py-2 bg-primary text-white font-semibold rounded-base hover:bg-primary-dark transition-colors duration-base cursor-pointer': {},
        },
        '.btn-secondary': {
          '@apply px-6 py-2 bg-grey-light text-grey border border-grey-medium rounded-base hover:bg-grey-medium hover:text-white transition-colors duration-base cursor-pointer': {},
        },
        '.btn-ghost': {
          '@apply px-6 py-2 text-primary hover:bg-primary hover:text-white rounded-base transition-colors duration-base cursor-pointer': {},
        },
        '.card': {
          '@apply bg-white rounded-lg shadow-base p-6 transition-shadow duration-base hover:shadow-lg': {},
        },
        '.input': {
          '@apply w-full px-4 py-2 border border-grey-light rounded-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-ring duration-base': {},
        },
        '.label': {
          '@apply text-sm font-medium text-grey mb-2 block': {},
        },
        '.heading-1': {
          '@apply text-4xl font-bold text-black': {},
        },
        '.heading-2': {
          '@apply text-3xl font-bold text-black': {},
        },
        '.heading-3': {
          '@apply text-2xl font-semibold text-black': {},
        },
        '.heading-4': {
          '@apply text-xl font-semibold text-black': {},
        },
        '.text-body': {
          '@apply text-base text-grey leading-relaxed': {},
        },
        '.text-small': {
          '@apply text-sm text-grey leading-normal': {},
        },
      });
    },
  ],
};

export default config;