import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SearchResult {
  type: 'company' | 'opportunity';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score?: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'company', 'opportunity', or undefined for all
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: SearchResult[] = [];
    const searchQuery = `%${query.toLowerCase()}%`;

    // Search companies
    if (!type || type === 'company') {
      const { data: companies } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          rcs_number,
          legal_form,
          parent_company_name,
          tp_assessments(total_score, priority_tier)
        `)
        .or(`name.ilike.${searchQuery},rcs_number.ilike.${searchQuery}`)
        .limit(limit);

      if (companies) {
        for (const company of companies) {
          const assessment = company.tp_assessments?.[0];
          results.push({
            type: 'company',
            id: company.id,
            title: company.name,
            subtitle: `${company.rcs_number}${company.legal_form ? ` - ${company.legal_form}` : ''}`,
            href: `/companies/${company.id}`,
            score: assessment?.total_score ?? undefined,
          });
        }
      }
    }

    // Search companies with TP assessments (high priority opportunities)
    if (!type || type === 'opportunity') {
      const { data: assessments } = await supabase
        .from('tp_assessments')
        .select(`
          id,
          total_score,
          priority_tier,
          company:companies!inner(id, name, rcs_number)
        `)
        .gte('total_score', 60) // Only show high-scoring opportunities
        .limit(limit);

      // Filter assessments by company name matching the query
      if (assessments) {
        for (const assessment of assessments) {
          const company = assessment.company as unknown as { id: string; name: string; rcs_number: string } | null;
          if (company && (
            company.name.toLowerCase().includes(query.toLowerCase()) ||
            company.rcs_number.toLowerCase().includes(query.toLowerCase())
          )) {
            // Avoid duplicates if company was already found
            const alreadyAdded = results.some(
              (r) => r.type === 'company' && r.id === company.id
            );
            if (!alreadyAdded) {
              results.push({
                type: 'opportunity',
                id: assessment.id,
                title: company.name,
                subtitle: `${assessment.priority_tier || 'Opportunity'} - Score: ${assessment.total_score ?? 'N/A'}`,
                href: `/companies/${company.id}`,
                score: assessment.total_score ?? undefined,
              });
            }
          }
        }
      }
    }

    // Sort by score (higher first), then by title
    results.sort((a, b) => {
      if (a.score !== undefined && b.score !== undefined) {
        return b.score - a.score;
      }
      if (a.score !== undefined) return -1;
      if (b.score !== undefined) return 1;
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json({
      success: true,
      data: {
        query,
        results: results.slice(0, limit),
        totalCount: results.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
