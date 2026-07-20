import { NextRequest } from 'next/server'

/**
 * In-memory token bucket rate limiter.
 * Tracks requests per IP address within a time window.
 * No external dependencies — pure Node.js Map.
 */

export function getClientIp(req: NextRequest): string {
  // On Vercel, x-forwarded-for is set by the edge network and is trustworthy.
  // On other platforms (e.g., raw Node.js), this header can be spoofed by clients.
  // Consider adding a trusted proxy check for non-Vercel deployments.
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return (req as any).ip ?? 'unknown'
}

interface Bucket {
  tokens: number
  lastRefill: number
}

const store = new Map<string, Bucket>()

interface RateLimitOptions {
  maxRequests?: number   // tokens per window (default: 5)
  windowMs?: number      // window size in ms (default: 60000 = 1 min)
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetMs: number } {
  const { maxRequests = 5, windowMs = 60_000 } = options
  const now = Date.now()

  const bucket = store.get(identifier)

  if (!bucket) {
    store.set(identifier, { tokens: maxRequests - 1, lastRefill: now })
    return { allowed: true, remaining: maxRequests - 1, resetMs: windowMs }
  }

  const elapsed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(elapsed / windowMs) * maxRequests

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, maxRequests)
    bucket.lastRefill = now
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1
    return { allowed: true, remaining: bucket.tokens, resetMs: windowMs - (elapsed % windowMs) }
  }

  return { allowed: false, remaining: 0, resetMs: windowMs - (elapsed % windowMs) }
}

/** Clean up expired entries periodically (optional memory optimization) */
export function cleanupRateLimitStore(maxAgeMs: number = 5 * 60_000): void {
  const now = Date.now()
  for (const [key, bucket] of store.entries()) {
    if (now - bucket.lastRefill > maxAgeMs) {
      store.delete(key)
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(() => cleanupRateLimitStore(), 5 * 60_000)
