import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require whitelist access
const PROTECTED_ROUTES = ['/swap', '/liquidity'];

// Routes that should be accessible without whitelist
const PUBLIC_ROUTES = ['/', '/whitelist'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, let the client-side handle the redirect
  // This is because we need to check wallet connection and on-chain whitelist status
  // which can only be done client-side with wagmi hooks
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
