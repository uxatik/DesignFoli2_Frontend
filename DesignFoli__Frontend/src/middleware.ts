import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected API routes
const protectedApiRoutes = [
  '/api/profile',
  '/api/projects',
  '/api/works',
  '/api/user',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedApiRoute) {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }

    // In a real application, you would validate the token here
    // For Firebase, you would verify the ID token with the Firebase Admin SDK
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For now, we'll just check if a token exists
    // In production, implement proper token validation
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
