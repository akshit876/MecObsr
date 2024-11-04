import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  '/register',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  // Add more public paths here as needed
];

// Define protected paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/operator-dashboard',
  '/part-number-select',
  // Add more protected paths here as needed
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if the current path is public
  const isPublicPath = PUBLIC_PATHS.some(path => 
    pathname.startsWith(path) || pathname === path
  );

  // If it's a public path, allow access without authentication
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For all other paths, check authentication
  const token = await getToken({ req: request });
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is operator and hasn't selected a part number
  if (token.role === 'operator' && 
      pathname !== '/part-number-select' && 
      !request.cookies.get('selectedPartConfig')) {
    return NextResponse.redirect(new URL('/part-number-select', request.url));
  }

  return NextResponse.next();
}

// Create matcher pattern from protected paths
const createMatcherPattern = (paths) => {
  return paths.map(path => 
    path.endsWith('*') ? path : `${path}/:path*`
  );
};

export const config = {
  matcher: [
    // Add specific paths that need checking
    ...createMatcherPattern(PROTECTED_PATHS),
    // Add public paths to matcher but they'll be handled in middleware
    ...PUBLIC_PATHS
  ]
}; 