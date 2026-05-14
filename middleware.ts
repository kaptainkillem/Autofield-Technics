import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  // For now, just let every request pass through
  return NextResponse.next();
}

// This tells Next.js to only run this on specific paths
export const config = {
  matcher: ['/admin/:path*'],
};