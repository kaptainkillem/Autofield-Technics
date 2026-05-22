import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, just let every request pass through
  return NextResponse.next();
}

// This tells Next.js to only run this on specific paths
export const config = {
  matcher: ['/admin/:path*'],
};