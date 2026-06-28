/**
 * Input sanitization utilities.
 * Strip HTML tags, enforce max lengths, trim whitespace.
 */

const HTML_TAG_PATTERN = /<[^>]*>/g

export function stripHtml(input: string): string {
  return input.replace(HTML_TAG_PATTERN, '')
}

export function sanitizeText(input: string, maxLength = 2000): string {
  let cleaned = stripHtml(input).trim()
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength)
  }
  return cleaned
}

export function sanitizePhone(input: string): string {
  // Allow only digits, spaces, +, -, (, )
  return input.replace(/[^\d\s+\-()]/g, '').trim()
}

export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

export function sanitizeName(input: string): string {
  // Allow letters, spaces, hyphens, apostrophes
  return input.replace(/[^\p{L}\s\-'’]/gu, '').trim()
}
