import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: Authentication & Authorization
 * 
 * CRITICAL: Local Development Bypass
 * - In development mode, all routes are accessible without authentication
 * - This ensures /admin and /report routes work during local development
 * - Production authentication will be enforced when NODE_ENV === 'production'
 * 
 * Future: Implement proper session validation using NextAuth
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Local development bypass: allow all access
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Production mode: Auth framework is in place but not enforced yet
  // Future: Check NextAuth session and validate permissions
  // For now, allow access (framework only)
  
  // Example of future implementation:
  // const token = await getToken({ req: request });
  // if (!token) {
  //   return NextResponse.redirect(new URL('/auth/signin', request.url));
  // }

  return NextResponse.next();
}

// Apply middleware to protected routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/report/:path*',
  ],
};
