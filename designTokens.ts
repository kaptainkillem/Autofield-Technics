// designTokens.ts
// Design tokens for consistent styling across the mechanic website
// Use these in all components for color consistency

export const colors = {
  // Primary Colors
  primary: {
    blue: '#5B9BD5',      // Primary CTA, buttons, links
    dark: '#2E75B6',      // Darker shade for hover states
    light: '#D5E8F0',     // Light background variant
  },
  
  // Neutral Colors
  neutral: {
    white: '#FFFFFF',     // Backgrounds, text backgrounds
    black: '#000000',     // Text, dark elements
    deepGrey: '#595959',  // Secondary text, borders
    lightGrey: '#E8E8E8', // Dividers, light backgrounds
    mediumGrey: '#B3B3B3', // Disabled states, subtle elements
  },
  
  // Semantic Colors
  semantic: {
    success: '#4CAF50',   // Positive actions, confirmations
    error: '#F44336',     // Errors, destructive actions
    warning: '#FF9800',   // Warnings, alerts
    info: '#2196F3',      // Information, help text
  },
  
  // Gradient Colors
  gradients: {
    primary: 'linear-gradient(135deg, #5B9BD5 0%, #2E75B6 100%)',
    subtle: 'linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%)',
  },

  // Opacity variants
  withOpacity: (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
};

export const typography = {
  // Font families
  fonts: {
    primary: 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    code: '"Courier New", monospace',
  },

  // Font sizes (in pixels)
  sizes: {
    xs: '12px',    // Small labels, helper text
    sm: '14px',    // Body text, small content
    base: '16px',  // Standard body text
    lg: '18px',    // Large text, list items
    xl: '20px',    // Subheadings
    '2xl': '24px', // Section headings
    '3xl': '32px', // Main headings
    '4xl': '48px', // Hero text
  },

  // Font weights
  weights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
  },
};

export const spacing = {
  // Spacing scale (in pixels)
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
};

export const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  elevated: '0 15px 30px rgba(0, 0, 0, 0.15)',
};

export const transitions = {
  fast: '150ms ease-in-out',
  base: '250ms ease-in-out',
  slow: '350ms ease-in-out',
  slowest: '500ms ease-in-out',
};

export const breakpoints = {
  mobile: '320px',
  mobileLg: '425px',
  tablet: '768px',
  desktop: '1024px',
  desktopLg: '1280px',
  wide: '1536px',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Utility function to use tokens in styled components
export const themeTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
};

export default themeTokens;