import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Update session in middleware
 * This refreshes the auth token and handles session management
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
};

/**
 * Check if the current path is a protected route
 */
export const isProtectedRoute = (pathname: string): boolean => {
  const protectedPaths = [
    '/upload',
    '/companies',
    '/processing',
    '/analytics',
    '/settings',
  ];

  // Dashboard root is also protected
  if (pathname === '/' || pathname === '/dashboard') {
    return true;
  }

  return protectedPaths.some((path) => pathname.startsWith(path));
};

/**
 * Check if the current path is an auth route
 */
export const isAuthRoute = (pathname: string): boolean => {
  const authPaths = ['/login', '/callback', '/auth'];
  return authPaths.some((path) => pathname.startsWith(path));
};
