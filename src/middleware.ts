// src/middleware.ts - Route protection middleware (disabled)
// Note: This middleware is disabled because the app uses localStorage-based authentication
// which is handled client-side. Next.js middleware runs on the server and cannot access
// localStorage. Route protection is handled by the ProtectedRoute component instead.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simply allow all requests to pass through
  // Authentication is handled client-side via the ProtectedRoute component
  return NextResponse.next();
}

// Configure which routes to run middleware on (minimal matcher to reduce overhead)
export const config = {
  matcher: [],
};
