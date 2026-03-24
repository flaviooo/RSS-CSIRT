import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie?.value === 'true';

  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/api/auth'];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/).*)',
  ],
};