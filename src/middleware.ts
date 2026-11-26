import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTHORIZED_EMAILS = [
  'admin@royalsparksfx.com',
  'operations@royalsparksfx.com',
  'finance@royalsparksfx.com',
];

const PUBLIC_EXTENSIONS = [
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.json',
  '.js',
  '.css',
  '.webmanifest',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, manifest, service worker and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico' ||
    PUBLIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // 2. Check for authenticated partner session
  const sessionCookie = request.cookies.get('royal_sparks_fx_session');
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuth = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  let isAuthenticated = false;

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
      if (
        parsed?.email &&
        AUTHORIZED_EMAILS.includes(parsed.email.toLowerCase().trim())
      ) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  } else if (hasSupabaseAuth) {
    isAuthenticated = true;
  }

  // 3. Protect Backend API Routes (Requirement 8)
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Access restricted to authorized Royal Sparks FX partners.',
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Handle Login Page
  if (pathname === '/login') {
    // If already authenticated, redirect to the primary Dashboard (Requirement 6)
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 5. Direct URL Protection for all business pages (Requirement 7 & 8)
  // If not logged in, show only the login page by redirecting
  if (!isAuthenticated) {
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
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
