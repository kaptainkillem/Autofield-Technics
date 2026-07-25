/**
 * Color utilities for deriving theme variants from a single brand color.
 */

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let sanitized = hex.replace('#', '')
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(sanitized.substring(0, 2), 16) / 255
  const g = parseInt(sanitized.substring(2, 4), 16) / 255
  const b = parseInt(sanitized.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
  return `#${f(0).toString(16).padStart(2, '0')}${f(8)
    .toString(16)
    .padStart(2, '0')}${f(4).toString(16).padStart(2, '0')}`
}

export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + amount)))
}

export function deriveThemeColors(primaryColor: string, accentColor: string) {
  return {
    primary: primaryColor,
    primaryDark: adjustLightness(primaryColor, -12),
    primaryLight: adjustLightness(primaryColor, 32),
    accent: accentColor,
    accentDark: adjustLightness(accentColor, -12),
    accentLight: adjustLightness(accentColor, 32),
  }
}
