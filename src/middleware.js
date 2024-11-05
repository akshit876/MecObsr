import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/operator-dashboard',
  '/part-number-select',
  '/shift-config',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only proceed if the current path is in PROTECTED_PATHS
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  
  if (!isProtectedPath) {
    console.log({pathname})
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Operator specific check
  if (token.role === 'operator' && 
      pathname !== '/part-number-select' && 
      !request.cookies.get('selectedPartConfig')) {
    return NextResponse.redirect(new URL('/part-number-select', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: PROTECTED_PATHS
};