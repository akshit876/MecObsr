import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  '/register',
  '/login',
  // '/forgot-password',
  // '/reset-password',
  // '/verify-email',
];

// Define protected paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/operator-dashboard',
  '/part-number-select',
  '/shift-config', // Add your protected paths here
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths completely
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // For all other paths, check authentication
  const token = await getToken({ req: request });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Add the original URL as a callback parameter
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is operator and hasn't selected a part number
  if (
    token.role === 'operator' &&
    pathname !== '/part-number-select' &&
    !request.cookies.get('selectedPartConfig')
  ) {
    return NextResponse.redirect(new URL('/part-number-select', request.url));
  }

  return NextResponse.next();
}

// Only run middleware on protected paths
export const config = {
  matcher: PROTECTED_PATHS.map((path) => (path.endsWith('/*') ? path : `${path}/:path*`)),
}; 