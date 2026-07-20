import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed, remaining } = checkRateLimit(`auth:reset-password:${ip}`, {
    maxRequests: 3,
    windowMs: 300_000,
  })

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again in 5 minutes.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  return NextResponse.json({ allowed: true }, { status: 200 })
}
