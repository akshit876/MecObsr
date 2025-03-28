import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected paths that require authentication
const PROTECTED_PATHS = [
  '/',
  '/part-number-config',
  '/serial-config',
  '/part-number-select',
  '/shift-config',
];

export async function middleware(request) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/part-number-config', '/serial-config', '/part-number-select', '/shift-config'],
};
