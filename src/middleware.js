import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ req: request });
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is operator and hasn't selected a part number
  if (token.role === 'operator' && 
      request.nextUrl.pathname !== '/part-number-select' && 
      !request.cookies.get('selectedPartConfig')) {
    return NextResponse.redirect(new URL('/part-number-select', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/operator-dashboard/:path*',
    '/part-number-select'
  ]
}; 