import { format, isValid, parse, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const DEFAULT_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Johannesburg'

/** Normalize date picker values and common human-readable dates for date-only API fields. */
export function normalizeDateOnly(value: unknown): string | undefined {
  if (value instanceof Date) {
    return isValid(value) ? format(value, 'yyyy-MM-dd') : undefined
  }
  if (typeof value !== 'string') return undefined

  const input = value.trim()
  if (!input) return undefined

  // Keep the calendar date from ISO timestamps without shifting it by timezone.
  const isoDate = input.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/)?.[1]
  if (isoDate) {
    const parsed = parseISO(isoDate)
    return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === isoDate ? isoDate : undefined
  }

  for (const pattern of [
    'd MMMM yyyy',
    'dd MMMM yyyy',
    'd MMM yyyy',
    'dd MMM yyyy',
    'MMMM d, yyyy',
    'MMMM dd, yyyy',
  ]) {
    const parsed = parse(input, pattern, new Date())
    if (isValid(parsed) && format(parsed, pattern) === input) {
      return format(parsed, 'yyyy-MM-dd')
    }
  }

  return undefined
}

/**
 * Check whether a yyyy-MM-dd date is strictly before today in the given
 * timezone. Today itself counts as current (allowed); only earlier dates
 * are considered past.
 */
export function isPastDate(dateStr: string, timezone: string = DEFAULT_TIMEZONE): boolean {
  const todayInTz = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd')
  return dateStr < todayInTz
}
