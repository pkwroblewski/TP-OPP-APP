import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const form = await req.formData();
  const file = form.get('file') as File;
  if (!file) return new Response('No file', { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const path = `filings/${hash}.pdf`;

  const { error: sErr } = await supabase.storage.from('filings').upload(path, bytes, {
    upsert: true,
    contentType: 'application/pdf',
  });
  if (sErr) return new Response(sErr.message, { status: 500 });

  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id || null;

  const { data: filing, error: fErr } = await supabase
    .from('filing')
    .insert({ file_hash: hash, filename: file.name })
    .select('id')
    .single();
  if (fErr) return new Response(fErr.message, { status: 500 });

  const rulesetId = (form.get('rulesetId') as string) || null;
  const { error: jErr } = await supabase
    .from('job')
    .insert({ filing_id: filing.id, created_by: uid, storage_path: path, ruleset_id: rulesetId });
  if (jErr) return new Response(jErr.message, { status: 500 });

  return new Response(JSON.stringify({ filingId: filing.id, hash }), { status: 201 });
}

