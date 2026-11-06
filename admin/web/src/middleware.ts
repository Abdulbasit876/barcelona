import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets, Next internals, APIs and driver portal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/driver')
  ) {
    return NextResponse.next();
  }

  // 2. Check for admin auth token cookie
  const token = request.cookies.get('btt_admin_token')?.value;
  const isLoginPage = pathname === '/login';

  // 3. If authenticated user attempts to access /login, redirect to /
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. If unauthenticated user attempts to access protected routes, redirect to /login
  if (!isLoginPage && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png, images (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
