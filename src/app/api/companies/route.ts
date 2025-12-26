import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const { allowed, resetTime } = checkRateLimit(
      `${clientId}:companies`,
      RATE_LIMITS.companies
    );

    if (!allowed) {
      return rateLimitResponse(resetTime);
    }

    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: companies || [] });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const { allowed, resetTime } = checkRateLimit(
      `${clientId}:companies`,
      RATE_LIMITS.companies
    );

    if (!allowed) {
      return rateLimitResponse(resetTime);
    }

    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data: company, error } = await supabase
      .from('companies')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create company', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: company });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
