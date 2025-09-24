// src/middleware.ts - Route protection middleware (optional)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ['/admin', '/analytics', '/approval-workflow'];
  const authRoute = '/login';

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Get auth token from cookies (you might store session info in cookies)
  const authToken = request.cookies.get('auth-token')?.value;

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !authToken) {
    // Redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = authRoute;
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login page
  if (pathname === authRoute && authToken) {
    // Redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
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
