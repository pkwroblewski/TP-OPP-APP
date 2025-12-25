import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (works for single instance)
// For production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Use first IP in x-forwarded-for if present
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return cfConnectingIp || realIp || 'unknown';
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or window has passed
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return { allowed, remaining, resetTime: entry.resetTime };
}

export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetTime),
      },
    }
  );
}

// Rate limit configurations for different API routes
export const RATE_LIMITS = {
  // More restrictive for expensive operations
  extract: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  analyse: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  upload: { maxRequests: 10, windowMs: 60000 }, // 10 per minute

  // Less restrictive for reads
  companies: { maxRequests: 60, windowMs: 60000 }, // 60 per minute
  export: { maxRequests: 20, windowMs: 60000 }, // 20 per minute

  // Default for other endpoints
  default: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
} as const;

// Higher-order function to wrap API routes with rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.default
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request);
    const { allowed, remaining, resetTime } = checkRateLimit(
      `${identifier}:${request.nextUrl.pathname}`,
      config
    );

    if (!allowed) {
      return rateLimitResponse(resetTime);
    }

    // Add rate limit headers to response
    const response = await handler(request);

    // Clone response to add headers
    const newResponse = new NextResponse(response.body, response);
    newResponse.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    newResponse.headers.set('X-RateLimit-Remaining', String(remaining));
    newResponse.headers.set('X-RateLimit-Reset', String(resetTime));

    return newResponse;
  };
}
